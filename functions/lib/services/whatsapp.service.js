"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const firebase_1 = require("../lib/firebase");
const admin = __importStar(require("firebase-admin"));
const templatesData = __importStar(require("../config/whatsappTemplates.json"));
// Type definitions for templates
const templates = templatesData;
const META_API_VERSION = "v21.0";
const WHATSAPP_INTERACTIONS_COLLECTION = "whatsapp_interactions";
// Static Group IDs
const ADMIN_GROUP_ID = "admin_group";
const STAFF_GROUP_ID = "staff_group";
// Optimization: Simple In-Memory Cache
const globalCache = new Map();
exports.WhatsappService = {
    // Check if the 24h window is open
    checkWindow: async (recipientId) => {
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
            const docRef = firebase_1.db.collection(WHATSAPP_INTERACTIONS_COLLECTION).doc(recipientId);
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
        }
        catch (error) {
            console.error("Error checking window:", error);
            return false;
        }
    },
    getLastInteraction: async (recipientId) => {
        try {
            const docRef = firebase_1.db.collection(WHATSAPP_INTERACTIONS_COLLECTION).doc(recipientId);
            const docSnap = await docRef.get();
            return docSnap.exists ? docSnap.data() : null;
        }
        catch (error) {
            console.error("Error getting interaction:", error);
            return null;
        }
    },
    updateLastInbound: async (senderId) => {
        try {
            const docRef = firebase_1.db.collection(WHATSAPP_INTERACTIONS_COLLECTION).doc(senderId);
            const now = new Date();
            await docRef.set({
                last_inbound_time: admin.firestore.FieldValue.serverTimestamp(),
                sender_id: senderId
            }, { merge: true });
            globalCache.set(`window_${senderId}`, { timestamp: now.getTime() });
            console.log(`Updated last_inbound_time for ${senderId}`);
        }
        catch (error) {
            console.error("Error updating last inbound:", error);
        }
    },
    sendMessage: async (to, content, templateName, templateParams, options) => {
        var _a;
        const isWindowOpen = await exports.WhatsappService.checkWindow(to);
        const url = `https://graph.facebook.com/${META_API_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;
        const headers = {
            "Authorization": `Bearer ${process.env.META_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        };
        let body = {
            messaging_product: "whatsapp",
            to: to
        };
        if (isWindowOpen || (options === null || options === void 0 ? void 0 : options.forceText)) {
            console.log(`Window OPEN (or Forced) for ${to}. Sending free-form message.`);
            body.type = "text";
            body.text = { body: content };
        }
        else {
            if (options === null || options === void 0 ? void 0 : options.skipIfClosed) {
                console.warn(`Window CLOSED for ${to}. Skipping message to save cost.`);
                return { status: "skipped", reason: "window_closed" };
            }
            console.log(`Window CLOSED for ${to}. Sending template.`);
            if (!templateName || !templates[templateName]) {
                console.warn(`No template specified or found. Sending text anyway.`);
                body.type = "text";
                body.text = { body: content };
            }
            else {
                const template = templates[templateName];
                if (template.text && !template.name) {
                    body.type = "text";
                    body.text = { body: template.text };
                }
                else {
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
                throw new Error(((_a = data.error) === null || _a === void 0 ? void 0 : _a.message) || "Failed to send WhatsApp message");
            }
            return data;
        }
        catch (error) {
            console.error("Error sending WhatsApp message:", error);
            throw error;
        }
    },
    sendToGroup: async (groupId, content) => {
        return exports.WhatsappService.sendMessage(groupId, content, "morning_ping");
    },
    sendOrderUpdate: async (orderId, status, customerPhone) => {
        let templateName;
        let params = [];
        if (status === "confirmed") {
            templateName = "order_confirmation";
            params = [orderId, "confirmed"];
        }
        else if (status === "shipped") {
            templateName = "order_shipped";
            params = [orderId, "shipped"];
        }
        const content = `Your order #${orderId} is now ${status}.`;
        return exports.WhatsappService.sendMessage(customerPhone, content, templateName, params);
    },
    getAdminGroupId: () => ADMIN_GROUP_ID,
    getStaffGroupId: () => STAFF_GROUP_ID,
};
//# sourceMappingURL=whatsapp.service.js.map