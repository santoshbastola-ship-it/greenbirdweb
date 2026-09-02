
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    } else {
        console.log("Service account credentials not found in env. Initializing with Project ID only.");
        initializeApp({
            projectId: projectId || 'greenbird-56584',
        });
    }
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log(`Successfully setup ${userData.role}: ${userData.email}`);
}

async function seedDebugData() {
    console.log("Seeding debug category and product...");
    
    // Create/Update Debug Category
    await db.collection('categories').doc('debug-category').set({
        name: 'Debug Category',
        type: 'products',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('Successfully setup category: Debug Category');

    // Create/Update Debug Product
    await db.collection('products').doc('mFenx0vu0TpZqKrqxHjE').set({
        name: 'Debug Test Product',
        description: 'Seeded debug product for E2E tests',
        categoryId: 'debug-category',
        currentPrice: 100,
        pricePerUnit: 100,
        unit: 'pcs',
        priceUnit: 'pcs',
        businessType: 'product',
        isActive: true,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('Successfully setup product: mFenx0vu0TpZqKrqxHjE');
}

async function main() {
    try {
        await createOrUpdateUser(TEST_ADMIN);
        await createOrUpdateUser(TEST_CUSTOMER);
        await seedDebugData();
        console.log('Test users created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test users:', error);
        process.exit(1);
    }
}

main();
