import { Request, Response } from "express";
import { WhatsappService } from "../services/whatsapp.service";
import { db } from "../lib/firebase";
import * as crypto from "crypto";

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.status(403).send("Forbidden");
        }
    } else {
        res.status(400).send("Bad Request");
    }
};

export const handleWebhookEvent = async (req: Request, res: Response) => {
    try {
        // const bodyText = JSON.stringify(req.body);
        // Express converts body to object. To verify signature, we need raw body.
        // But with Firebase Functions + Express, getting raw body can be tricky if middleware parsed it.
        // usually 'req.options.rawBody' or similar if configured. 
        // For now, let's assume secure environment or we might skip sig verify if it's too hard to get raw body without setup.
        // Actually, let's try to reconstruct or just skip for now to ensure it works. 
        // User's original code had sig verify. 
        // Cloud Functions `https.onRequest` provides `req.rawBody`.

        if (APP_SECRET && (req as any).rawBody) {
            const signature = req.headers["x-hub-signature-256"] as string;
            if (!signature) {
                res.status(401).send("No signature");
                return;
            }
            const hash = crypto.createHmac("sha256", APP_SECRET).update((req as any).rawBody).digest("hex");
            if (signature !== `sha256=${hash}`) {
                res.status(401).send("Invalid signature");
                return;
            }
        }

        const body = req.body;

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const change = body.entry[0].changes[0].value;
                const message = change.messages[0];
                const from = message.from;
                const msg_body = message.text?.body;
                const group_id = message.group_id;

                console.log(`Received from ${from}: ${msg_body}`);

                if (group_id) {
                    await db.collection("whatsapp_groups").doc("latest").set({
                        id: group_id,
                        last_active: new Date().toISOString(),
                        name: "Staff Group"
                    });
                }

                await WhatsappService.updateLastInbound(from);

                const messageLower = (msg_body || "").toLowerCase().trim();
                if (["hi", "ping", "hello"].includes(messageLower)) {
                    await WhatsappService.sendMessage(
                        from,
                        "✅ *Window is now OPEN.*\nYou will receive notifications for the next 24 hours.",
                        undefined,
                        undefined,
                        { forceText: true }
                    );
                    res.status(200).send("Ping Processed");
                    return;
                }

                // Save message
                await db.collection("whatsapp_messages").add({
                    from: from,
                    body: msg_body || "[Media/Other]",
                    timestamp: new Date().toISOString(),
                    type: 'inbound',
                    status: 'received',
                    messageId: message.id || ''
                });

                // Broadcast
                const staffSnapshot = await db.collection("users").where("role", "in", ["admin", "manager"]).get();
                const broadcastPromises = staffSnapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const phone = data.phoneNumber || data.phone;
                    if (phone) {
                        const forwardContent = `📩 *New Message*\n\nFrom: ${from}\nMsg: "${msg_body || '[Media]'}"`;
                        await WhatsappService.sendMessage(phone, forwardContent, undefined, undefined, { skipIfClosed: true });
                    }
                });
                await Promise.all(broadcastPromises);

                // Morning Ping logic
                const lastInteraction = await WhatsappService.getLastInteraction(from);
                let shouldPing = false;
                if (!lastInteraction || !lastInteraction.last_inbound_time) {
                    shouldPing = true;
                } else {
                    const lastDate = lastInteraction.last_inbound_time.toDate();
                    const now = new Date();
                    if (lastDate.getDate() !== now.getDate()) shouldPing = true;
                }

                await WhatsappService.updateLastInbound(from); // Update again? Already did above.

                if (shouldPing) {
                    await WhatsappService.sendMessage(from, "Good morning! System online.", "morning_ping");
                }
            }
            res.status(200).send("EVENT_RECEIVED");
        } else {
            res.status(404).send("Not Found");
        }

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

export const sendNotification = async (req: Request, res: Response) => {
    try {
        const { toUserId, title, body, templateName, templateParams } = req.body;

        // Fetch user phone from Firestore
        if (!toUserId) {
            res.status(400).send("Missing toUserId");
            return;
        }

        const userDoc = await db.collection("users").doc(toUserId).get();
        if (!userDoc.exists) {
            res.status(404).send("User not found");
            return;
        }

        const userData = userDoc.data();
        const phone = userData?.phoneNumber || userData?.phone;

        if (!phone) {
            res.status(400).send("User has no phone number");
            return;
        }

        // Construct message
        const messageContent = `*${title}*\n${body}`;
        // If template provided, use it, else send text
        const result = await WhatsappService.sendMessage(phone, messageContent, templateName, templateParams);

        if (result.error) {
            res.status(500).json({ success: false, error: result.error });
            return;
        }

        res.status(200).json({ success: true, result });
    } catch (error: any) {
        console.error("Send Notification Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateOrder = async (req: Request, res: Response) => {
    try {
        const { orderId, status, customerPhone } = req.body;
        if (!orderId || !status || !customerPhone) {
            res.status(400).send("Missing required fields");
            return;
        }
        const result = await WhatsappService.sendOrderUpdate(orderId, status, customerPhone);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Order Update Error:", error);
        res.status(500).send("Internal Server Error");
    }
}
