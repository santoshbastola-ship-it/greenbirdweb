import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
// cloud functions automatically use Application Default Credentials
if (!admin.apps.length) {
    admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging(); // For push notifications
