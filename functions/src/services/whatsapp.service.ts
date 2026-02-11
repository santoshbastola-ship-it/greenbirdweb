import { db } from "../lib/firebase";
import * as admin from "firebase-admin";
import * as templatesData from "../config/whatsappTemplates.json";

// Type definitions for templates
const templates = templatesData as Record<string, any>;

const META_API_VERSION = "v21.0";
const WHATSAPP_INTERACTIONS_COLLECTION = "whatsapp_interactions";

// Static Group IDs
const ADMIN_GROUP_ID = "admin_group";
const STAFF_GROUP_ID = "staff_group";

// Optimization: Simple In-Memory Cache
const globalCache = new Map<string, { timestamp: number }>();

export const WhatsappService = {
    // Check if the 24h window is open
    checkWindow: async (recipientId: string): Promise<boolean> => {
        try {
            const cacheKey = `window_${recipientId}`;
            const cached = globalCache.get(cacheKey);
            const now = new Date();

            if (cached) {
                if (now.getTime() - cached.timestamp < 23 * 60 * 60 * 1000) {
                    console.log(`[Cache] Window open for ${recipientId} (using cache)`);
                    return true;
                }
            }

            const docRef = db.collection(WHATSAPP_INTERACTIONS_COLLECTION).doc(recipientId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const data = docSnap.data();
                if (data && data.last_inbound_time) {
                    const lastInbound = data.last_inbound_time.toDate();
                    const diff = now.getTime() - lastInbound.getTime();
                    const isOpen = diff < 24 * 60 * 60 * 1000;

                    if (isOpen) {
                        globalCache.set(cacheKey, { timestamp: lastInbound.getTime() });
                    }
                    return isOpen;
                }
            }
            return false;
        } catch (error) {
            console.error("Error checking window:", error);
            return false;
        }
    },

    getLastInteraction: async (recipientId: string): Promise<any> => {
        try {
            const docRef = db.collection(WHATSAPP_INTERACTIONS_COLLECTION).doc(recipientId);
            const docSnap = await docRef.get();
            return docSnap.exists ? docSnap.data() : null;
        } catch (error) {
            console.error("Error getting interaction:", error);
            return null;
        }
    },

    updateLastInbound: async (senderId: string): Promise<void> => {
        try {
            const docRef = db.collection(WHATSAPP_INTERACTIONS_COLLECTION).doc(senderId);
            const now = new Date();
            await docRef.set({
                last_inbound_time: admin.firestore.FieldValue.serverTimestamp(),
                sender_id: senderId
            }, { merge: true });

            globalCache.set(`window_${senderId}`, { timestamp: now.getTime() });
            console.log(`Updated last_inbound_time for ${senderId}`);
        } catch (error) {
            console.error("Error updating last inbound:", error);
        }
    },

    sendMessage: async (to: string, content: string, templateName?: string, templateParams?: string[], options?: { forceText?: boolean; skipIfClosed?: boolean }): Promise<any> => {
        const isWindowOpen = await WhatsappService.checkWindow(to);
        const url = `https://graph.facebook.com/${META_API_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;

        const headers = {
            "Authorization": `Bearer ${process.env.META_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        };

        let body: any = {
            messaging_product: "whatsapp",
            to: to
        };

        if (isWindowOpen || options?.forceText) {
            console.log(`Window OPEN (or Forced) for ${to}. Sending free-form message.`);
            body.type = "text";
            body.text = { body: content };
        } else {
            if (options?.skipIfClosed) {
                console.warn(`Window CLOSED for ${to}. Skipping message to save cost.`);
                return { status: "skipped", reason: "window_closed" };
            }

            console.log(`Window CLOSED for ${to}. Sending template.`);

            if (!templateName || !templates[templateName]) {
                console.warn(`No template specified or found. Sending text anyway.`);
                body.type = "text";
                body.text = { body: content };
            } else {
                const template = templates[templateName];

                if (template.text && !template.name) {
                    body.type = "text";
                    body.text = { body: template.text };
                } else {
                    body.type = "template";
                    body.template = {
                        name: template.name || templateName,
                        language: { code: template.language || "en" },
                        components: []
                    };

                    if (template.components && templateParams && templateParams.length > 0) {
                        body.template.components = [
                            {
                                type: "body",
                                parameters: templateParams.map(param => ({
                                    type: "text",
                                    text: param
                                }))
                            }
                        ];
                    }
                }
            }
        }

        try {
            // using global fetch (available in Node 18+)
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Meta API Error Response:", JSON.stringify(data, null, 2));
                throw new Error(data.error?.message || "Failed to send WhatsApp message");
            }

            return data;
        } catch (error: any) {
            console.error("Error sending WhatsApp message:", error);
            throw error;
        }
    },

    sendToGroup: async (groupId: string, content: string): Promise<any> => {
        return WhatsappService.sendMessage(groupId, content, "morning_ping");
    },

    sendOrderUpdate: async (orderId: string, status: string, customerPhone: string): Promise<any> => {
        let templateName: string | undefined;
        let params: string[] = [];

        if (status === "confirmed") {
            templateName = "order_confirmation";
            params = [orderId, "confirmed"];
        } else if (status === "shipped") {
            templateName = "order_shipped";
            params = [orderId, "shipped"];
        }

        const content = `Your order #${orderId} is now ${status}.`;
        return WhatsappService.sendMessage(customerPhone, content, templateName, params);
    },

    getAdminGroupId: () => ADMIN_GROUP_ID,
    getStaffGroupId: () => STAFF_GROUP_ID,
};
