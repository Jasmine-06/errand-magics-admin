# Notification System Troubleshooting Guide

## How the System Works

1. **When an order is placed** → It's added to Firestore `orders` collection
2. **Admin panel listens** → `subscribeToOrders()` detects new orders via `snapshot.docChanges()`
3. **Notification created** → `createNewOrderNotification()` adds a document to `notifications` collection
4. **Admin bell listens** → `subscribeToAdminNotifications()` listens to notifications in real-time
5. **Notification appears** → Shows in bell icon, plays sound, shows toast

## Troubleshooting Steps

### Step 1: Check Browser Console

Open your browser's DevTools (F12) and look for these logs:

**When placing an order:**
```
🆕 New order detected: [orderId] [orderNumber]
⏰ Order time: [timestamp]
⏱️ Time diff (ms): [number]
⏱️ Time diff (min): [number]
✅ Within 10 min? true
📢 Creating notification for new order: [orderNumber]
Creating new order notification for order: [orderNumber]
Notification data: { ... }
✅ Admin notification created successfully for new order [orderNumber], ID: [notificationId]
```

**When notification subscription receives data:**
```
📡 Subscribing to admin notifications...
📬 Received X admin notifications
📭 Unread notifications: Y
Latest notification: { ... }
```

### Step 2: Check for Errors

**Firestore Index Error:**
If you see:
```
❌ Error in notification subscription
Error code: failed-precondition
🔍 FIRESTORE INDEX REQUIRED!
```

**Solution:**
1. Deploy the Firestore indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```
2. Or click the link in the console error to create the index automatically
3. Wait 2-3 minutes for index to build

### Step 3: Check Time Window

The system only creates notifications for orders placed within the **last 10 minutes**.

If you're testing with old orders:
- They will be detected but skipped
- Look for: `⏭️ Skipping old order (beyond 10 min window)`

### Step 4: Manual Test

1. Open browser console
2. Run this command to create a test notification:
```javascript
// Copy and paste this in browser console
import('./src/test-notification.ts').then(m => m.default());
```

Or create notification manually:
```javascript
// In browser console
const { collection, addDoc } = await import('firebase/firestore');
const { db } = await import('./src/lib/firebase');

await addDoc(collection(db, "notifications"), {
  type: "new_order",
  title: "🧪 Test Notification",
  message: "Test message",
  orderId: "test-" + Date.now(),
  orderNumber: "TEST-" + Date.now(),
  customerId: "test",
  customerName: "Test Customer",
  customerEmail: "test@test.com",
  customerPhone: "1234567890",
  total: 100,
  paymentMethod: "cash_on_delivery",
  status: "placed",
  targetAudience: "admin",
  isRead: false,
  priority: "high",
  createdAt: new Date().toISOString(),
});
```

### Step 5: Check Firestore Rules

Verify your `firebase.rules` allows reading/writing notifications:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 6: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "firestore"
3. Place an order
4. Look for:
   - POST request to create notification
   - WebSocket for real-time subscription

### Step 7: Verify Authentication

Make sure you're logged in as an admin user. The notification subscription requires authentication.

## Common Issues

### Issue: "No notifications appearing"
**Solutions:**
1. Check console for errors
2. Verify Firestore index is created
3. Ensure order was placed within last 10 minutes
4. Try manual test notification

### Issue: "Index required error"
**Solution:**
```bash
firebase deploy --only firestore:indexes
```
Wait 2-3 minutes, then refresh page.

### Issue: "Old orders not creating notifications"
**This is by design!**
- Only orders from last 10 minutes create notifications
- This prevents spam when admin panel loads
- Place a NEW order to test

### Issue: "Notification created but not showing"
**Check:**
1. Is notification subscription active? (Look for "📡 Subscribing" log)
2. Is notification bell component mounted?
3. Check `targetAudience` is "admin" in Firestore

## Verification Checklist

- [ ] Browser console shows order detection logs
- [ ] Browser console shows notification creation logs
- [ ] Browser console shows notification subscription logs
- [ ] Firestore index is created and active
- [ ] Firebase rules allow read/write
- [ ] User is authenticated
- [ ] Order is within 10-minute window
- [ ] Notification document exists in Firestore
- [ ] Notification bell component is mounted

## Quick Test

1. Open admin panel
2. Open browser console
3. Place a new order (from customer app or manually in Firestore)
4. Within 2 seconds, you should see all the logs above
5. Notification should appear in bell icon
6. Sound should play
7. Toast notification should show

## Still Not Working?

1. Share the browser console output
2. Check Firestore console → Database → notifications collection
3. Verify notification document was created
4. Check if `targetAudience` field is "admin"
5. Verify `createdAt` is recent
