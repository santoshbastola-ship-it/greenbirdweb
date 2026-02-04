import { NextRequest, NextResponse } from "next/server";
import { adminMessaging } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
    try {
        const { toUserId, title, body, imageUrl, data } = await req.json();

        if (!toUserId || !title || !body) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get User's FCM Token from Firestore
        const userDoc = await getDoc(doc(db, "users", toUserId));
        if (!userDoc.exists()) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
            console.log(`[Push] User ${toUserId} has no FCM token. Skipping push.`);
            return NextResponse.json({ message: "User has no FCM token" }, { status: 200 });
        }

        // 2. Send Push Notification
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

        const response = await adminMessaging.send(message);
        console.log(`[Push] Successfully sent message to ${toUserId}:`, response);

        return NextResponse.json({ success: true, messageId: response });

    } catch (error: any) {
        console.error("[Push] Error sending notification:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
