import { NextRequest, NextResponse } from "next/server";
import { WhatsappService } from "@/services/whatsapp.service";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { toUserId, title, body: messageBody } = body;

        console.log(`[API] Processing WhatsApp notification for User ${toUserId}`);

        // 1. Get User's Phone Number (Securely on Server)
        const userDoc = await getDoc(doc(db, "users", toUserId));
        if (!userDoc.exists()) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const userData = userDoc.data();
        let phoneNumber = userData.phoneNumber || userData.phone;

        if (!phoneNumber) {
            console.warn(`[API] User ${toUserId} has no phone number.`);
            return NextResponse.json({ message: "User has no phone number" }, { status: 200 }); // Not an error, just skipped
        }

        // Ensure phone number has country code (977 for Nepal)
        // Remove any spaces, dashes, or special characters
        phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

        // If phone number doesn't start with 977 and is 10 digits, add 977 prefix
        if (!phoneNumber.startsWith('977') && phoneNumber.length === 10) {
            phoneNumber = '977' + phoneNumber;
            console.log(`[API] Added country code 977 to phone number: ${phoneNumber}`);
        }

        // 2. Send Message via Service (Server-side, has env vars)
        const content = `*${title}*\n${messageBody}`;
        const result = await WhatsappService.sendMessage(
            phoneNumber,
            content,
            undefined,
            undefined
            // Note: Removed skipIfClosed to ensure customer notifications are delivered
            // If window is closed, will use template message (small cost, but ensures delivery)
        );

        // 3. CARBON COPY (CC) to WhatsApp Admin (9779765142494)
        // Ensures Admin sees all automated messages sent to customers
        const WHATSAPP_ADMIN_NUMBER = "9779765142494";

        if (phoneNumber !== WHATSAPP_ADMIN_NUMBER) {
            console.log(`[API] Sending CC to Admin (${WHATSAPP_ADMIN_NUMBER})`);

            // Format CC message
            // Include Customer Name if available for better context
            const customerName = userData.displayName || userData.name || "Customer";
            const ccContent = `🔔 *Sent to ${customerName} (${phoneNumber})*:\n\n"${content}"`;

            // Send CC (Use skipIfClosed: true to keep it free logic)
            try {
                await WhatsappService.sendMessage(
                    WHATSAPP_ADMIN_NUMBER,
                    ccContent,
                    undefined,
                    undefined,
                    { skipIfClosed: true } // Keep it free. Admin should ping bot to open window.
                );
            } catch (ccError) {
                console.error("[API] Failed to send CC to Admin:", ccError);
            }
        }

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error("Error in whatsapp notification api:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
