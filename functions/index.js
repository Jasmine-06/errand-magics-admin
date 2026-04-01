const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Function to send FCM notification to all admins when a new order is created
exports.sendNewOrderNotification = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const orderId = context.params.orderId;

    try {
      console.log('New order created:', orderId, orderData.orderNumber);

      // Get all admin FCM tokens
      const adminsSnapshot = await db.collection('admins').get();
      const adminTokens = [];

      adminsSnapshot.forEach((doc) => {
        const adminData = doc.data();
        if (adminData.fcmToken) {
          adminTokens.push(adminData.fcmToken);
        }
      });

      if (adminTokens.length === 0) {
        console.log('No admin FCM tokens found');
        return null;
      }

      console.log(`Sending notification to ${adminTokens.length} admins`);

      // Create notification payload
      const payload = {
        notification: {
          title: '🎉 New Order Received!',
          body: `Order #${orderData.orderNumber} from ${orderData.customerName} - ₹${orderData.total}`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: orderId,
        },
        data: {
          orderId: orderId,
          orderNumber: orderData.orderNumber,
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          total: String(orderData.total),
          type: 'new_order',
          click_action: `/orders/${orderId}`,
        },
      };

      // Send to all admin devices
      const response = await messaging.sendToDevice(adminTokens, payload, {
        priority: 'high',
        timeToLive: 60 * 60 * 24, // 24 hours
      });

      console.log('Notification sent successfully:', response);
    } catch (error) {
      console.error('Error sending FCM notification:', error);
    }

    try {
      // Create notification document for in-app notifications (Outside FCM block)
      // Use orderId as document ID to ensure idempotency
      await db.collection('notifications').doc(orderId).set({
        type: 'new_order',
        title: '🎉 New Order Received!',
        message: `Order #${orderData.orderNumber} from ${orderData.customerName} - ₹${orderData.total}`,
        orderId: orderId,
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        status: orderData.status,
        targetAudience: 'admin',
        isRead: false,
        priority: 'high',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log('In-app notification created/updated for order:', orderId);
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }

    return null;
  });

// Function to send notification when order status changes
exports.sendOrderStatusUpdateNotification = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const orderId = context.params.orderId;

    // Check if status changed
    if (beforeData.status === afterData.status) {
      return null;
    }

    try {
      console.log('Order status changed:', orderId, beforeData.status, '->', afterData.status);

      // Get all admin FCM tokens
      const adminsSnapshot = await db.collection('admins').get();
      const adminTokens = [];

      adminsSnapshot.forEach((doc) => {
        const adminData = doc.data();
        if (adminData.fcmToken) {
          adminTokens.push(adminData.fcmToken);
        }
      });

      if (adminTokens.length === 0) {
        console.log('No admin FCM tokens found');
        return null;
      }

      const statusMessages = {
        confirmed: 'Order Confirmed',
        preparing: 'Order Being Prepared',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Order Delivered',
        cancelled: 'Order Cancelled',
      };

      const statusMessage = statusMessages[afterData.status] || 'Order Updated';

      // Create notification payload
      const payload = {
        notification: {
          title: statusMessage,
          body: `Order #${afterData.orderNumber} status updated`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: orderId,
        },
        data: {
          orderId: orderId,
          orderNumber: afterData.orderNumber,
          status: afterData.status,
          type: 'order_status_update',
          click_action: `/orders/${orderId}`,
        },
      };

      // Send to all admin devices
      const response = await messaging.sendToDevice(adminTokens, payload, {
        priority: 'normal',
        timeToLive: 60 * 60 * 24,
      });

      console.log('Status update notification sent:', response);

      return response;
    } catch (error) {
      console.error('Error sending status update notification:', error);
      return null;
    }
  });
