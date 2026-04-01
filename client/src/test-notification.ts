// Test script to manually create a notification
// Run this in the browser console to test notification creation

import { collection, addDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

async function createTestNotification() {
  try {
    const notificationData = {
      type: "new_order",
      title: "🧪 Test Notification",
      message: "This is a test notification to verify the system is working",
      orderId: "test-" + Date.now(),
      orderNumber: "TEST-" + Date.now(),
      customerId: "test-customer",
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "1234567890",
      total: 100,
      paymentMethod: "cash_on_delivery",
      status: "placed",
      targetAudience: "admin",
      isRead: false,
      priority: "high",
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    console.log("✅ Test notification created with ID:", docRef.id);
    console.log("Check your notification bell!");
    
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating test notification:", error);
    throw error;
  }
}

// Make it globally available
(window as any).createTestNotification = createTestNotification;

console.log("To create a test notification, run: createTestNotification()");
