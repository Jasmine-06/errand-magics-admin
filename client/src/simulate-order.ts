import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./lib/firebase";

async function simulateOrder() {
    const orderId = "simulated-" + Date.now();
    const orderNumber = "SIM-" + Date.now().toString().slice(-6);

    console.log(`🚀 Simulating new order: ${orderNumber}`);

    try {
        // Add to orders collection
        await addDoc(collection(db, "orders"), {
            orderNumber,
            customerName: "Test Robot",
            total: 999,
            status: "placed",
            createdAt: serverTimestamp(),
            customerId: "robot-123",
            items: [{ productId: "test", name: "Test Product", quantity: 1, price: 999 }]
        });

        console.log("✅ Order added. Now check the notifications collection in Firestore.");
        console.log("Wait up to 30 seconds for Cloud Functions or client-side triggers to fire.");
    } catch (error) {
        console.error("❌ Error simulating order:", error);
    }
}

// Global expose
(window as any).simulateOrder = simulateOrder;
console.log("Run simulateOrder() to test.");
