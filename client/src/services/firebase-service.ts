import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Product,
  Vendor,
  Order,
  User,
  Category,
  TimeRulesConfig,
  TimeSlot,
} from "@/types";

export class FirebaseService {
  // Generic CRUD operations
  static async create<T>(
    collectionName: string,
    data: Omit<T, "id">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${collectionName}:`, error);
      throw error;
    }
  }

  static async update<T>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
      throw error;
    }
  }

  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
      throw error;
    }
  }

  static async getById<T>(
    collectionName: string,
    id: string
  ): Promise<T | null> {
    try {
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error);
      throw error;
    }
  }

  // Paginated queries
  static async getPaginated<T>(
    collectionName: string,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    filters?: any
  ): Promise<{
    data: T[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    try {
      let q = query(
        collection(db, collectionName),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "") {
            q = query(q, where(key, "==", value));
          }
        });
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      const lastVisible =
        querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      return { data, lastDoc: lastVisible };
    } catch (error) {
      console.error(`Error getting paginated ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listeners
  static subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    filters?: any
  ): () => void {
    let q = query(collection(db, collectionName), orderBy("createdAt", "desc"));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          q = query(q, where(key, "==", value));
        }
      });
    }

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      callback(data);
    });
  }

  // Specific service methods
  static async getProducts(
    filters?: any,
    pagination?: { page: number; pageSize: number }
  ) {
    if (pagination) {
      return this.getPaginated<Product>(
        "products",
        pagination.pageSize,
        undefined,
        filters
      );
    }
    return this.subscribeToCollection<Product>("products", () => { }, filters);
  }

  static async getVendors(
    filters?: any,
    pagination?: { page: number; pageSize: number }
  ) {
    if (pagination) {
      return this.getPaginated<Vendor>(
        "vendors",
        pagination.pageSize,
        undefined,
        filters
      );
    }
    return this.subscribeToCollection<Vendor>("vendors", () => { }, filters);
  }

  static async getOrders(
    filters?: any,
    pagination?: { page: number; pageSize: number }
  ) {
    if (pagination) {
      return this.getPaginated<Order>(
        "orders",
        pagination.pageSize,
        undefined,
        filters
      );
    }
    return this.subscribeToCollection<Order>("orders", () => { }, filters);
  }

  static async getUsers(
    filters?: any,
    pagination?: { page: number; pageSize: number }
  ) {
    if (pagination) {
      return this.getPaginated<User>(
        "users",
        pagination.pageSize,
        undefined,
        filters
      );
    }
    return this.subscribeToCollection<User>("users", () => { }, filters);
  }

  static async getCategories(
    filters?: any,
    pagination?: { page: number; pageSize: number }
  ) {
    if (pagination) {
      return this.getPaginated<Category>(
        "categories",
        pagination.pageSize,
        undefined,
        filters
      );
    }
    return this.subscribeToCollection<Category>(
      "categories",
      () => { },
      filters
    );
  }

  // Authentication is now handled by Firebase Auth in auth-context.tsx

  // Time Rules methods
  static async getTimeRules(): Promise<TimeRulesConfig> {
    try {
      const docSnap = await getDoc(doc(db, "settings", "timeRules"));
      if (docSnap.exists()) {
        return docSnap.data() as TimeRulesConfig;
      }

      return {};
    } catch (error) {
      console.error("Error getting time rules:", error);
      return {};
    }
  }

  static async updateTimeRules(timeRules: TimeRulesConfig): Promise<void> {
    try {
      await setDoc(doc(db, "settings", "timeRules"), timeRules);
    } catch (error) {
      console.error("Error updating time rules:", error);
      throw error;
    }
  }

  // Get current active time slot
  static async getCurrentActiveTimeSlot(): Promise<TimeSlot | null> {
    try {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const q = query(
        collection(db, "timeSlots"),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);
      const timeSlots = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeSlot[];

      return timeSlots.find(slot => {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60;
          return currentTime >= startMinutes || currentTime <= (endMinutes - 24 * 60);
        }

        return currentTime >= startMinutes && currentTime <= endMinutes;
      }) || null;
    } catch (error) {
      console.error("Error getting current active time slot:", error);
      return null;
    }
  }
}