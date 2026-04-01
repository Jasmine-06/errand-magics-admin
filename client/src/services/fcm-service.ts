import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export class FCMService {
  private static VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  // Request notification permission and get FCM token
  static async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn("Firebase Messaging is not supported in this environment");
        return null;
      }

      if (!this.VAPID_KEY) {
        console.warn("FCM VAPID Key is missing. Browser push notifications will be disabled.");
        return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.log("Notification permission denied");
        return null;
      }

      console.log("Notification permission granted");

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: this.VAPID_KEY,
      });

      if (token) {
        console.log("FCM Token:", token);
        return token;
      } else {
        console.log("No registration token available");
        return null;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  // Save FCM token to admin user document
  static async saveAdminFCMToken(userId: string, token: string): Promise<void> {
    try {
      const adminRef = doc(db, "admins", userId);

      // Check if admin document exists
      const adminDoc = await getDoc(adminRef);

      // Use setDoc with merge to handle both create and update safely
      await setDoc(adminRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date().toISOString(),
      }, { merge: true });

      console.log("FCM token saved/updated for admin:", userId);
    } catch (error) {
      console.error("Error saving FCM token:", error);
    }
  }

  // Listen for foreground messages
  static setupForegroundMessageListener(
    onMessageReceived: (payload: any) => void
  ): () => void {
    if (!messaging) {
      console.warn("Firebase Messaging is not supported");
      return () => { };
    }

    return onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      onMessageReceived(payload);

      // Show browser notification if permission is granted
      if (Notification.permission === "granted") {
        const notificationTitle = payload.notification?.title || "New Notification";
        const notificationOptions = {
          body: payload.notification?.body || "",
          icon: payload.notification?.icon || "/logo.png",
          badge: "/logo.png",
          tag: payload.data?.orderId || "notification",
          requireInteraction: true,
          data: payload.data,
        };

        new Notification(notificationTitle, notificationOptions);
      }
    });
  }

  // Check if notifications are supported
  static isNotificationSupported(): boolean {
    return "Notification" in window && "serviceWorker" in navigator;
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}
