import { Request, Response } from "express";
import { messaging, db } from "../lib/firebase";

export const sendPush = async (req: Request, res: Response) => {
    try {
        const { toUserId, title, body, imageUrl, data } = req.body;

        if (!toUserId || !title || !body) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const userDoc = await db.collection("users").doc(toUserId).get();
        if (!userDoc.exists) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;

        if (!fcmToken) {
            res.status(200).json({ message: "User has no FCM token" });
            return;
        }

        const message: any = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: data?.url || '/',
            },
            token: fcmToken,
        };

        if (imageUrl) {
            message.notification.imageUrl = imageUrl;
        }

        const response = await messaging.send(message);
        res.status(200).json({ success: true, messageId: response });

    } catch (error: any) {
        console.error("[Push] Error:", error);
        res.status(500).json({ error: error.message });
    }
};
