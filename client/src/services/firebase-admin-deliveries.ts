import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    writeBatch,
    Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export class AdminFirebaseDeliveryService {
    private static deliveriesCollection = "deliveries";


    // SUBSCRIBE TO DELIVERIES

    static subscribeToDeliveries(callback: (deliveries: any[]) => void) {
        const ref = collection(db, this.deliveriesCollection);
        const q = query(ref, orderBy("createdAt", "desc"));

        return onSnapshot(q, (snapshot) => {
            const deliveries: any[] = [];

            snapshot.forEach((doc) => {
                const d = doc.data();

                deliveries.push({
                    id: doc.id,
                    ...d,
                    createdAt: d.createdAt?.toDate(),
                    startTime: d.startTime?.toDate(),
                });
            });

            callback(deliveries);
        });
    }

    // CREATE DELIVERY (NEW SCHEMA)

    static async createDelivery(deliveryData: any) {
        const now = Timestamp.now();

        const payload = {
            ...deliveryData,
            createdAt: now,
            startTime: now,
        };

        const ref = await addDoc(collection(db, this.deliveriesCollection), payload);
        return ref.id;
    }


    // UPDATE DELIVERY STATUS

    static async updateDeliveryStatus(deliveryId: string, newStatus: string) {
        const ref = doc(db, this.deliveriesCollection, deliveryId);
        const snap = await getDoc(ref);

        if (!snap.exists()) throw new Error("Delivery not found");

        await updateDoc(ref, {
            status: newStatus,
        });

        return true;
    }


    // ASSIGN DELIVERY PARTNER (FIXED)
    static async assignDelivery(orderId: string, partner: any) {
        const now = Timestamp.now();

        const delivery = {
            id: crypto.randomUUID(),
            orderId,
            deliveryPartnerId: partner.id,
            earnings: partner.earningPerDelivery ?? 0,
            distance: 0,
            status: "active",
            createdAt: now,
            startTime: now,
        };

        const ref = await addDoc(collection(db, this.deliveriesCollection), delivery);
        return ref.id;
    }


    // BULK UPDATE DELIVERY STATUS
    static async bulkUpdateDeliveryStatus(deliveryIds: string[], newStatus: string) {
        const batch = writeBatch(db);

        for (const id of deliveryIds) {
            const ref = doc(db, this.deliveriesCollection, id);
            batch.update(ref, { status: newStatus });
        }

        await batch.commit();
    }


    // DASHBOARD STATS
    static async getDeliveryStatistics() {
        const snap = await getDocs(collection(db, this.deliveriesCollection));

        let total = 0;
        let active = 0;
        let deliveredToday = 0;
        let totalEarnings = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        snap.forEach((doc) => {
            const d = doc.data();
            const createdAt = d.createdAt?.toDate() ?? new Date();

            total++;

            if (d.status === "active") active++;

            if (d.status === "delivered") {
                const deliverTime = d.startTime?.toDate() ?? null;

                if (deliverTime && deliverTime >= today) {
                    deliveredToday++;
                }

                totalEarnings += d.earnings ?? 0;
            }
        });

        return {
            totalDeliveries: total,
            activeDeliveries: active,
            deliveredToday,
            totalEarnings,
        };
    }
}
