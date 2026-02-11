
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        credential: applicationDefault(),
    });
}

const auth = getAuth();
const db = getFirestore();

const TEST_ADMIN = {
    email: 'test-admin@greenbird.com',
    password: 'password123!',
    name: 'Test Admin',
    role: 'admin'
};

const TEST_CUSTOMER = {
    email: 'test-customer@greenbird.com',
    password: 'password123!',
    name: 'Test Customer',
    role: 'customer'
};

async function createOrUpdateUser(userData: any) {
    let uid = '';
    try {
        const userRecord = await auth.getUserByEmail(userData.email);
        console.log(`User ${userData.email} already exists. Updating...`);
        uid = userRecord.uid;
        await auth.updateUser(uid, {
            emailVerified: true,
            password: userData.password,
            displayName: userData.name,
        });
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log(`Creating user ${userData.email}...`);
            const userRecord = await auth.createUser({
                email: userData.email,
                emailVerified: true,
                password: userData.password,
                displayName: userData.name,
            });
            uid = userRecord.uid;
        } else {
            throw error;
        }
    }

    // Set Custom Claims for Role
    await auth.setCustomUserClaims(uid, { role: userData.role });

    // Create/Update Firestore Document
    await db.collection('users').doc(uid).set({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: true,
        department: userData.role === 'admin' ? 'IT' : 'Customer',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Successfully setup ${userData.role}: ${userData.email}`);
}

async function main() {
    try {
        await createOrUpdateUser(TEST_ADMIN);
        await createOrUpdateUser(TEST_CUSTOMER);
        console.log('Test users created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test users:', error);
        process.exit(1);
    }
}

main();
