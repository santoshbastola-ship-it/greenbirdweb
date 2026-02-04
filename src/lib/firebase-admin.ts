import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    } else {
        console.warn("Firebase Admin keys missing. Skipping initialization. Features requiring Admin SDK will not work.");
    }
}

// Safely export services
const adminAuth = admin.apps.length ? admin.auth() : null;
const adminDb = admin.apps.length ? admin.firestore() : null;
const adminMessaging = admin.apps.length ? admin.messaging() : null;

export { admin, adminAuth, adminDb, adminMessaging };
