"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPush = void 0;
const firebase_1 = require("../lib/firebase");
const sendPush = async (req, res) => {
    try {
        const { toUserId, title, body, imageUrl, data } = req.body;
        if (!toUserId || !title || !body) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        const userDoc = await firebase_1.db.collection("users").doc(toUserId).get();
        if (!userDoc.exists) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const userData = userDoc.data();
        const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
        if (!fcmToken) {
            res.status(200).json({ message: "User has no FCM token" });
            return;
        }
        const message = {
            notification: {
                title,
                body,
            },
            data: Object.assign(Object.assign({}, data), { click_action: (data === null || data === void 0 ? void 0 : data.url) || '/' }),
            token: fcmToken,
        };
        if (imageUrl) {
            message.notification.imageUrl = imageUrl;
        }
        const response = await firebase_1.messaging.send(message);
        res.status(200).json({ success: true, messageId: response });
    }
    catch (error) {
        console.error("[Push] Error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.sendPush = sendPush;
//# sourceMappingURL=notification.controller.js.map