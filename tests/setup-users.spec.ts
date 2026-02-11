
import { test } from '@playwright/test';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

test('Ensure Test Users Exist in Auth', async () => {
    // Initialize Firebase
    // We do this inside the test or global setup. Doing it here for simplicity.
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    const auth = getAuth(app);

    const users = [
        { email: 'test-admin@greenbird.com', password: 'password123!' },
        { email: 'test-customer@greenbird.com', password: 'password123!' }
    ];

    for (const user of users) {
        try {
            console.log(`Checking user: ${user.email}`);
            await signInWithEmailAndPassword(auth, user.email, user.password);
            console.log(`User ${user.email} exists.`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                console.log(`User ${user.email} not found. Creating...`);
                try {
                    await createUserWithEmailAndPassword(auth, user.email, user.password);
                    console.log(`User ${user.email} created.`);
                } catch (createError: any) {
                    console.error(`Failed to create user ${user.email}:`, createError);
                    // If email already in use but password wrong, we can't reset it easily here without admin sdk.
                    // We assume for clean env or first run.
                }
            } else {
                console.error(`Error checking user ${user.email}:`, error);
            }
        }
    }
});
