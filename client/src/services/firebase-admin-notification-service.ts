import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  addDoc,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Your admin panel firebase config
import { AdminNotification } from "@/types";

export class AdminFirebaseNotificationService {
  private static notificationsCollection = "notifications";
  // Get admin notifications
  static async getAdminNotifications(
    limitCount: number = 20
  ): Promise<AdminNotification[]> {
    try {
      const notificationsRef = collection(db, this.notificationsCollection);
      const q = query(
        notificationsRef,
        where("targetAudience", "==", "admin"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications: AdminNotification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt
            ? typeof data.createdAt === "string"
              ? new Date(data.createdAt)
              : data.createdAt.toDate()
            : new Date(),
        } as AdminNotification);
      });

      return notifications;
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      return [];
    }
  }

  // Subscribe to admin notifications
  static subscribeToAdminNotifications(
    callback: (notifications: AdminNotification[]) => void,
    onError?: (error: Error) => void
  ) {
    const notificationsRef = collection(db, this.notificationsCollection);
    const q = query(
      notificationsRef,
      where("targetAudience", "==", "admin"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    console.log('📡 Subscribing to admin notifications...');

    return onSnapshot(
      q,
      (querySnapshot) => {
        const notifications: AdminNotification[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt
              ? typeof data.createdAt === "string"
                ? new Date(data.createdAt)
                : data.createdAt.toDate()
              : new Date(),
          } as AdminNotification);
        });

        console.log(`📬 Received ${notifications.length} admin notifications`);
        console.log(`📭 Unread notifications: ${notifications.filter(n => !n.isRead).length}`);

        if (notifications.length > 0) {
          console.log('Latest notification:', notifications[0]);
        }

        callback(notifications);
      },
      (error) => {
        console.error('❌ Error in notification subscription:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        if (error.code === 'failed-precondition') {
          console.error('🔍 FIRESTORE INDEX REQUIRED!');
          console.error('Create a composite index for:');
          console.error('Collection: notifications');
          console.error('Fields: targetAudience (ASC), createdAt (DESC)');
          console.error('Click the link in the console to create the index automatically');
        }

        if (onError) {
          onError(error as Error);
        }
      }
    );
  }

  // Mark all admin notifications as read
  static async markAllAdminNotificationsAsRead(): Promise<void> {
    try {
      const notificationsRef = collection(db, this.notificationsCollection);
      const q = query(
        notificationsRef,
        where("targetAudience", "==", "admin"),
        where("isRead", "==", false)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: new Date().toISOString(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error marking all admin notifications as read:", error);
      throw error;
    }
  }

  // Get admin unread notification count
  static async getAdminUnreadNotificationCount(): Promise<number> {
    try {
      const notificationsRef = collection(db, this.notificationsCollection);
      const q = query(
        notificationsRef,
        where("targetAudience", "==", "admin"),
        where("isRead", "==", false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting admin unread count:", error);
      return 0;
    }
  }

  // Create admin notification
  static async createAdminNotification(
    notification: Omit<AdminNotification, "id" | "createdAt" | "targetAudience">
  ): Promise<void> {
    try {
      const notificationsRef = collection(db, this.notificationsCollection);
      await addDoc(notificationsRef, {
        ...notification,
        targetAudience: "admin",
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating admin notification:", error);
      throw error;
    }
  }
  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(
        db,
        this.notificationsCollection,
        notificationId
      );
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
}
