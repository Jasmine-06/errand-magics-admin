import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export class AdminFirebaseDeliveryPartnerService {
    private static partnersCollection = "deliveryPartners";

    //  SUBSCRIBE TO ALL PARTNERS (Realtime)
    static subscribeToPartners(callback: (partners: any[]) => void) {
        const ref = collection(db, this.partnersCollection);
        const q = query(ref, orderBy("createdAt", "desc"));

        return onSnapshot(q, (snapshot) => {
            const partners: any[] = [];

            snapshot.forEach((doc) => {
                const d = doc.data();

                partners.push({
                    id: doc.id,
                    ...d,
                    createdAt: d.createdAt && typeof d.createdAt.toDate === "function" ? d.createdAt.toDate() : d.createdAt,
                    updatedAt: d.updatedAt && typeof d.updatedAt.toDate === "function" ? d.updatedAt.toDate() : d.updatedAt,
                });
            });

            callback(partners);
        });
    }

    //  CREATE NEW PARTNER
    static async createPartner(partnerData: any) {
        const now = Timestamp.now();

        const payload = {
            ...partnerData,
            createdAt: now,
            updatedAt: now,
            adminApproved: false,
            status: "inactive",
            rating: 0,
            totalDeliveries: 0,
        };

        const ref = await addDoc(collection(db, this.partnersCollection), payload);
        return ref.id;
    }

    //  GET SINGLE PARTNER
    static async getPartner(partnerId: string) {
        const ref = doc(db, this.partnersCollection, partnerId);
        const snap = await getDoc(ref);

        if (!snap.exists()) return null;

        const d = snap.data();

        return {
            id: snap.id,
            ...d,
            createdAt: d.createdAt && typeof d.createdAt.toDate === "function" ? d.createdAt.toDate() : d.createdAt,
            updatedAt: d.updatedAt && typeof d.updatedAt.toDate === "function" ? d.updatedAt.toDate() : d.updatedAt,
        };
    }

    //  UPDATE PARTNER DATA
    static async updatePartner(partnerId: string, updateData: any) {
        const ref = doc(db, this.partnersCollection, partnerId);

        await updateDoc(ref, {
            ...updateData,
            updatedAt: Timestamp.now(),
        });

        return true;
    }

    //  APPROVE / DISAPPROVE PARTNER
    static async setPartnerApproval(partnerId: string, approved: boolean) {
        const ref = doc(db, this.partnersCollection, partnerId);

        await updateDoc(ref, {
            adminApproved: approved,
            updatedAt: Timestamp.now(),
        });

        return true;
    }

    //  ACTIVATE / DEACTIVATE PARTNER
    static async setPartnerStatus(partnerId: string, status: "active" | "inactive") {
        const ref = doc(db, this.partnersCollection, partnerId);

        await updateDoc(ref, {
            status,
            updatedAt: Timestamp.now(),
        });

        return true;
    }


    //  BULK UPDATE PARTNER STATUS

    static async bulkSetPartnerStatus(partnerIds: string[], status: string) {
        const batch = writeBatch(db);

        const now = Timestamp.now();

        for (const id of partnerIds) {
            const ref = doc(db, this.partnersCollection, id);
            batch.update(ref, {
                status,
                updatedAt: now,
            });
        }

        await batch.commit();
    }


    //  GET ALL PARTNERS (one time)

    static async getAllPartners() {
        const snap = await getDocs(collection(db, this.partnersCollection));

        return snap.docs.map((doc) => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                createdAt: d.createdAt && typeof d.createdAt.toDate === "function" ? d.createdAt.toDate() : d.createdAt,
                updatedAt: d.updatedAt && typeof d.updatedAt.toDate === "function" ? d.updatedAt.toDate() : d.updatedAt,
            };
        });
    }
}
