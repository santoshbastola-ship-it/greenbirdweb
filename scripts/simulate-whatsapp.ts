/**
 * WhatsApp Notification Simulation Script
 * 
 * This script demonstrates how to trigger a WhatsApp notification 
 * via the Cloud Function API, bypassing the frontend UI.
 */

async function simulateOrderUpdate() {
    const API_URL = "https://your-region-your-project.cloudfunctions.net/api/whatsapp/order-update";
    const TEST_PHONE = "97798XXXXXXXX"; // Replace with your phone
    const ORDER_ID = "TEST-123";

    console.log(`🚀 Simulating order update for ${ORDER_ID}...`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: ORDER_ID,
                status: "confirmed", // This should map to order_confirmation template
                customerPhone: TEST_PHONE
            })
        });

        const data = await response.json();
        console.log("✅ API Response:", data);

        if (data.success) {
            console.log("📱 Notification should be sent! Check your WhatsApp.");
        } else {
            console.error("❌ Notification failed:", data.error);
        }
    } catch (error) {
        console.error("💥 Simulation Error:", error);
    }
}

// simulateOrderUpdate();
