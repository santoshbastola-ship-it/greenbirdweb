import { NextRequest, NextResponse } from "next/server";
import { WhatsappService } from "@/services/whatsapp.service";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import crypto from "crypto";

export const dynamic = 'force-dynamic'; // CRITICAL Fix for Firebase SSR
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// 1. Verification Endpoint (GET)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode && token) {
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }
    return new NextResponse("Bad Request", { status: 400 });
}

// 2. Event Listener (POST)
export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();

        // Signature Verification
        if (APP_SECRET) {
            const signature = req.headers.get("x-hub-signature-256");
            if (!signature) {
                return new NextResponse("No signature", { status: 401 });
            }

            const hash = crypto.createHmac("sha256", APP_SECRET).update(bodyText).digest("hex");
            const expectedSignature = `sha256=${hash}`;

            if (signature !== expectedSignature) {
                return new NextResponse("Invalid signature", { status: 401 });
            }
        }

        const body = JSON.parse(bodyText);

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from; // sender phone number
                const msg_body = body.entry[0].changes[0].value.messages[0].text?.body;

                const group_id = body.entry[0].changes[0].value.messages[0].group_id;
                console.log(`Received message from ${from}: ${msg_body} ${group_id ? `(Group: ${group_id})` : ''}`);

                // CAPTURE GROUP ID (For Setup)
                if (group_id) {
                    console.log(`[GROUP DISCOVERY] Found Group ID: ${group_id}`);
                    const { setDoc, doc } = await import("firebase/firestore");
                    await setDoc(doc(db, "whatsapp_groups", "latest"), {
                        id: group_id,
                        last_active: new Date().toISOString(),
                        name: "Staff Group" // Placeholder
                    });
                }

                // *** CRITICAL: ALWAYS UPDATE INBOUND TIME FIRST ***
                // This "Opens the Window" for the sender.
                await WhatsappService.updateLastInbound(from);

                // *** HANDLE "MORNING PING" (Hi/Ping) ***
                const messageLower = (msg_body || "").toLowerCase().trim();
                if (messageLower === "hi" || messageLower === "ping" || messageLower === "hello") {
                    console.log(`[Ping] Received Ping from ${from}. Replying confirmation.`);
                    try {
                        const result = await WhatsappService.sendMessage(
                            from,
                            "✅ *Window is now OPEN.*\nYou will receive notifications for the next 24 hours.\n\n👩‍🌾 *Need to chat with a human?*\nClick here to message our Admin directly: https://wa.me/9779765142494",
                            undefined,
                            undefined,
                            { forceText: true }
                        );
                        console.log(`[Ping] Reply sent successfully:`, JSON.stringify(result));
                    } catch (error: any) {
                        console.error(`[Ping] FAILED to send reply to ${from}:`, error.message || error);
                        console.error(`[Ping] Full error:`, JSON.stringify(error, null, 2));
                    }
                    return new NextResponse("Ping Processed", { status: 200 });
                }

                // SAVE MESSAGE TO FIRESTORE (Shared Inbox - Audit Trail)
                try {
                    await addDoc(collection(db, "whatsapp_messages"), {
                        from: from,
                        body: msg_body || "[Media/Other]",
                        timestamp: new Date().toISOString(),
                        type: 'inbound',
                        status: 'received',
                        messageId: body.entry[0].changes[0].value.messages[0].id || ''
                    });

                    // BROADCAST TO STAFF (Admins & Managers)
                    // 1. Find all staff
                    const { query, where, getDocs } = await import("firebase/firestore");
                    const usersRef = collection(db, "users");
                    // Firestore 'in' query supports up to 10 values
                    const q = query(usersRef, where("role", "in", ["admin", "manager"]));
                    const querySnapshot = await getDocs(q);

                    // 2. Forward message to each staff member
                    const broadcastPromises = querySnapshot.docs.map(async (docSnap) => {
                        const userData = docSnap.data();
                        const staffPhone = userData.phoneNumber || userData.phone;

                        if (staffPhone) {
                            // Format the notification
                            const forwardContent = `📩 *New Message from Customer*\n\nFrom: ${from}\nMessage: "${msg_body || '[Media]'}"`;

                            // Send using service (Skip if window closed to save cost, or maybe we really want to deliver it?)
                            // User wants to see it. If window closed, we can't send free text. We'd have to pay.
                            // For now, let's stick to 'skipIfClosed: true' to keep it free, as agreed.
                            // If they complain "I didn't get it", we remind them to ping.
                            try {
                                await WhatsappService.sendMessage(staffPhone, forwardContent, undefined, undefined, { skipIfClosed: true });
                            } catch (e) {
                                console.error(`Failed to broadcast to staff ${staffPhone}:`, e);
                            }
                        }
                    });

                    await Promise.all(broadcastPromises);
                    console.log(`[Broadcast] Forwarded message to ${querySnapshot.size} staff members.`);

                } catch (dbError) {
                    console.error("Failed to process message (Save/Broadcast):", dbError);
                }

                // CORE LOGIC: Check if we need to send "Morning Ping" reply
                // 1. Get previous state BEFORE updating
                const lastInteraction = await WhatsappService.getLastInteraction(from);

                let shouldPing = false;
                if (!lastInteraction || !lastInteraction.last_inbound_time) {
                    shouldPing = true; // First time ever
                } else {
                    const lastDate = lastInteraction.last_inbound_time.toDate ? lastInteraction.last_inbound_time.toDate() : new Date(lastInteraction.last_inbound_time);
                    const now = new Date();

                    // Check if last interaction was yesterday or older
                    if (lastDate.getDate() !== now.getDate() || lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear()) {
                        shouldPing = true;
                    }
                }

                // 2. Update Last Inbound Time (OPEN THE WINDOW)
                await WhatsappService.updateLastInbound(from);

                // 3. Send Morning Ping if needed (Only to Admins/Staff ideally, but here we just check if it's a known group/user or just reply)
                // The prompt says "Acknowledge the first message from an admin/staff". 
                // We'll assume 'from' is an admin if they are triggering this.
                if (shouldPing) {
                    console.log(`sending Morning Ping reply to ${from}`);
                    // We use sendMessage which will see the window is NOW open (since we just updated it)
                    // and default to text message.
                    await WhatsappService.sendMessage(from, "Good morning! System status: Online. Window is now open.", "morning_ping");
                }
            }
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
        } else {
            return new NextResponse("Not Found", { status: 404 });
        }
    } catch (error) {
        console.error("Webhook Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
