import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import templates from "@/config/whatsappTemplates.json";

const META_API_VERSION = "v21.0";
const WHATSAPP_INTERACTIONS_COLLECTION = "whatsapp_interactions";

// Static Group IDs (User should replace these with real IDs)
const ADMIN_GROUP_ID = "admin_group"; // Placeholder or real WA Group ID
const STAFF_GROUP_ID = "staff_group"; // Placeholder or real WA Group ID

// Optimization: Simple In-Memory Cache
const globalCache = new Map<string, { timestamp: number }>();

export const WhatsappService = {
    // In-Memory Cache (Global variable persists in warm Cloud Function instances)
    // Reduces Firestore reads for "checkWindow" significantly.
    checkWindow: async (recipientId: string): Promise<boolean> => {
        try {
            // 1. Check Cache first
            const cacheKey = `window_${recipientId}`;
            const cached = globalCache.get(cacheKey);
            const now = new Date();

            if (cached) {
                // If we have a cached "true" state that is recent (< 23 hours old interaction), use it.
                // We add a buffer of 1 hour to be safe.
                if (now.getTime() - cached.timestamp < 23 * 60 * 60 * 1000) {
                    console.log(`[Cache] Window open for ${recipientId} (using cache)`);
                    return true;
                }
            }

            // 2. Fallback to Firestore
            const docRef = doc(db, WHATSAPP_INTERACTIONS_COLLECTION, recipientId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.last_inbound_time) {
                    const lastInbound = data.last_inbound_time instanceof Timestamp ? data.last_inbound_time.toDate() : new Date(data.last_inbound_time);
                    const diff = now.getTime() - lastInbound.getTime();

                    const isOpen = diff < 24 * 60 * 60 * 1000;

                    // 3. Update Cache if Open
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

    // Get interaction data (to check if we need to ping back)
    getLastInteraction: async (recipientId: string): Promise<any> => {
        try {
            const docRef = doc(db, WHATSAPP_INTERACTIONS_COLLECTION, recipientId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Error getting interaction:", error);
            return null;
        }
    },



    // Update the last inbound message time for a sender
    updateLastInbound: async (senderId: string): Promise<void> => {
        try {
            const docRef = doc(db, WHATSAPP_INTERACTIONS_COLLECTION, senderId);
            const now = new Date(); // Capture time
            await setDoc(docRef, {
                last_inbound_time: serverTimestamp(),
                sender_id: senderId
            }, { merge: true });

            // CRITICAL FIX: Update Cache Immediately
            globalCache.set(`window_${senderId}`, { timestamp: now.getTime() });

            console.log(`Updated last_inbound_time for ${senderId}`);
        } catch (error) {
            console.error("Error updating last inbound:", error);
        }
    },

    // Send a message cost-optimized based on the window status
    sendMessage: async (to: string, content: string, templateName?: keyof typeof templates, templateParams?: string[], options?: { forceText?: boolean; skipIfClosed?: boolean }): Promise<any> => {
        const cleanTo = to.replace(/\D/g, "");
        const isWindowOpen = await WhatsappService.checkWindow(cleanTo);
        const url = `https://graph.facebook.com/${META_API_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;

        const headers = {
            "Authorization": `Bearer ${process.env.META_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        };

        let body: any = {
            messaging_product: "whatsapp",
            to: cleanTo
        };

        if (isWindowOpen || options?.forceText) {
            // Window OPEN or Forced: Send Free-form Text ($0.00)
            console.log(`Window OPEN (or Forced) for ${to}. Sending free-form message.`);
            body.type = "text";
            body.text = { body: content };
        } else {
            // Window CLOSED
            if (options?.skipIfClosed) {
                console.warn(`Window CLOSED for ${to}. Skipping message to save cost.`);
                return { status: "skipped", reason: "window_closed" };
            }

            // Fallback to Template (Paid)
            console.log(`Window CLOSED for ${to}. Sending template.`);

            if (!templateName || !templates[templateName]) {
                console.warn(`No template specified or found for closed window fallback. Sending text anyway (may fail or cost more).`);
                body.type = "text";
                body.text = { body: content };
            } else {
                const template = templates[templateName] as any;

                // Handle simple text templates (like morning_ping)
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

                    // Add parameters if enabled in template and provided
                    if (templateComponentsAreValid(template, templateParams)) {
                        body.template.components = [
                            {
                                type: "body",
                                parameters: templateParams?.map(param => ({
                                    type: "text",
                                    text: param
                                })) || []
                            }
                        ];
                    }
                }
            }
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error sending WhatsApp message:", error);
            throw error;
        }
    },

    // Simplified wrapper for Group messages
    sendToGroup: async (groupId: string, content: string): Promise<any> => {
        // Treat group ID as a recipient
        // Uses "morning_ping" template if window is likely closed/needs refresh, or text if open.
        // But for explicit "Morning Ping" command from system:
        return WhatsappService.sendMessage(groupId, content, "morning_ping");
    },

    // Hooks for E-commerce
    sendOrderUpdate: async (orderId: string, status: string, customerPhone: string): Promise<any> => {
        let templateName: keyof typeof templates | undefined;
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

// Helper type guard / validator
function templateComponentsAreValid(template: any, params?: string[]) {
    return template.components && params && params.length > 0;
}
