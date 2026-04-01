import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, auth } from "./lib/firebase";

export async function runFullDiagnostic() {
    console.log("🚀 [DIAGNOSTIC] Starting full notification system diagnostic...");

    // 1. Check Auth State
    const user = auth.currentUser;
    console.log("👤 [DIAGNOSTIC] Current Auth User:", user ? user.uid : "NOT LOGGED IN");
    if (!user) {
        console.error("❌ [DIAGNOSTIC] You must be logged in to run this diagnostic.");
        return;
    }

    // 2. Check Orders Collection
    try {
        const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5)));
        console.log(`📦 [DIAGNOSTIC] Total orders found (limit 5): ${ordersSnap.size}`);
        ordersSnap.forEach(d => {
            const data = d.data();
            const age = data.createdAt ? (Date.now() - (data.createdAt.toDate ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime())) / 60000 : 'unknown';
            console.log(`   - Order #${data.orderNumber}, ID: ${d.id}, Age: ${Math.floor(Number(age))} mins`);
        });
    } catch (e) {
        console.error("❌ [DIAGNOSTIC] Error reading orders:", e);
    }

    // 3. Check Notifications Collection (Broad)
    try {
        const allNotifsSnap = await getDocs(collection(db, "notifications"));
        console.log(`📊 [DIAGNOSTIC] Total notifications in DB (any audience): ${allNotifsSnap.size}`);
    } catch (e) {
        console.error("❌ [DIAGNOSTIC] Error reading all notifications:", e);
    }

    // 4. Check Admin Notifications (Filtered)
    try {
        const q = query(
            collection(db, "notifications"),
            where("targetAudience", "==", "admin"),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const adminNotifsSnap = await getDocs(q);
        console.log(`🔔 [DIAGNOSTIC] Admin notifications found (filtered): ${adminNotifsSnap.size}`);
        adminNotifsSnap.forEach(d => {
            const data = d.data();
            console.log(`   - Notification: ${data.title}, Order: ${data.orderNumber}, Created: ${data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt}`);
        });
    } catch (e: any) {
        console.error("❌ [DIAGNOSTIC] Error reading admin notifications:", e);
        if (e.code === 'failed-precondition') {
            console.warn("⚠️ [DIAGNOSTIC] MISSING INDEX detected! This is likely the cause.");
        }
    }

    // 5. Check Cloud Function Deployment (Implicitly)
    console.log("📜 [DIAGNOSTIC] Reminder: Ensure Cloud Functions are deployed via 'firebase deploy --only functions'");
    console.log("🚀 [DIAGNOSTIC] Diagnostic complete.");
}

// Global expose
(window as any).runFullDiagnostic = runFullDiagnostic;
console.log("✅ Diagnostic script loaded. Run 'runFullDiagnostic()' in the console.");
