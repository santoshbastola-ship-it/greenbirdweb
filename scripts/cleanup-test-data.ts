#!/usr/bin/env tsx

/**
 * Standalone script to clean up all test data from the database
 * 
 * This script removes:
 * - All transactions/orders created by test users
 * - All products named "Test Product"
 * - All categories named "Test Category"
 * - All notifications sent to test users
 * - Stock history (embedded in products, cleaned when products are deleted)
 * 
 * Usage: npm run cleanup:test-data
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Test user credentials
const TEST_USERS = [
    { email: 'test-admin@greenbird.com', password: 'password123!', role: 'admin' },
    { email: 'test-customer@greenbird.com', password: 'password123!', role: 'customer' }
];

interface TestUserIds {
    adminId: string;
    customerId: string;
}

/**
 * Get Firebase UIDs for test users
 */
async function getTestUserIds(): Promise<TestUserIds> {
    const ids: TestUserIds = { adminId: '', customerId: '' };

    try {
        console.log('🔐 Authenticating test users...\n');

        // Sign in as test admin to get UID
        const adminCred = await signInWithEmailAndPassword(auth, TEST_USERS[0].email, TEST_USERS[0].password);
        ids.adminId = adminCred.user.uid;
        console.log(`✓ Test Admin ID: ${ids.adminId}`);

        // Sign in as test customer to get UID
        const customerCred = await signInWithEmailAndPassword(auth, TEST_USERS[1].email, TEST_USERS[1].password);
        ids.customerId = customerCred.user.uid;
        console.log(`✓ Test Customer ID: ${ids.customerId}\n`);

    } catch (error) {
        console.error('❌ Error getting test user IDs:', error);
        throw error;
    }

    return ids;
}

/**
 * Delete all categories with names containing "Test"
 */
async function cleanupTestCategories(): Promise<number> {
    try {
        const categoriesRef = collection(db, 'categories');
        const querySnapshot = await getDocs(categoriesRef);

        const testCategories = querySnapshot.docs.filter(doc => {
            const name = (doc.data().name || '').toLowerCase();
            return name.includes('test');
        });

        if (testCategories.length === 0) {
            console.log('  No test categories found');
            return 0;
        }

        console.log(`  Found ${testCategories.length} test categories`);

        const deletePromises = testCategories.map(docSnapshot => {
            console.log(`  - Deleting category: ${docSnapshot.id} (${docSnapshot.data().name})`);
            return deleteDoc(doc(db, 'categories', docSnapshot.id));
        });

        await Promise.all(deletePromises);
        console.log(`  ✓ Deleted ${testCategories.length} test categories\n`);
        return testCategories.length;
    } catch (error) {
        console.error('  ❌ Error cleaning up test categories:', error);
        return 0;
    }
}

/**
 * Delete all products with names containing "Test", "Auto", or "Debug"
 */
async function cleanupTestProducts(): Promise<number> {
    try {
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);

        const testProducts = querySnapshot.docs.filter(doc => {
            const name = (doc.data().name || '').toLowerCase();
            return name.includes('test') || name.includes('auto') || name.includes('debug');
        });

        if (testProducts.length === 0) {
            console.log('  No test products found');
            return 0;
        }

        console.log(`  Found ${testProducts.length} test products`);

        const deletePromises = testProducts.map(docSnapshot => {
            console.log(`  - Deleting product: ${docSnapshot.id} (${docSnapshot.data().name})`);
            return deleteDoc(doc(db, 'products', docSnapshot.id));
        });

        await Promise.all(deletePromises);
        console.log(`  ✓ Deleted ${testProducts.length} test products (including stock history)\n`);
        return testProducts.length;
    } catch (error) {
        console.error('  ❌ Error cleaning up test products:', error);
        return 0;
    }
}

/**
 * Delete all transactions associated with test users
 */
async function cleanupTestTransactions(testUserIds: TestUserIds): Promise<string[]> {
    try {
        const transactionsRef = collection(db, 'transactions');
        const allTransactions: any[] = [];

        // Query for transactions by test customer
        const customerQuery = query(transactionsRef, where('customerId', '==', testUserIds.customerId));
        const customerSnapshot = await getDocs(customerQuery);
        allTransactions.push(...customerSnapshot.docs);

        // Query for transactions by test admin (in case admin created orders)
        const adminQuery = query(transactionsRef, where('customerId', '==', testUserIds.adminId));
        const adminSnapshot = await getDocs(adminQuery);
        allTransactions.push(...adminSnapshot.docs);

        // Query for transactions where enteredBy is test admin
        const enteredByQuery = query(transactionsRef, where('enteredBy', '==', testUserIds.adminId));
        const enteredBySnapshot = await getDocs(enteredByQuery);

        // Get ALL transactions to filter by partyName containing "Test"
        // This is necessary because Firestore doesn't support case-insensitive contains queries
        const allTransactionsSnapshot = await getDocs(transactionsRef);
        const testNameTransactions = allTransactionsSnapshot.docs.filter(doc => {
            const data = doc.data();
            const partyName = data.partyName || '';
            // Match if partyName contains "Test" (case-insensitive)
            return partyName.toLowerCase().includes('test');
        });

        // Merge and deduplicate
        const uniqueTransactions = new Map();
        [...allTransactions, ...enteredBySnapshot.docs, ...testNameTransactions].forEach(doc => {
            uniqueTransactions.set(doc.id, doc);
        });

        if (uniqueTransactions.size === 0) {
            console.log('  No test transactions found');
            return [];
        }

        console.log(`  Found ${uniqueTransactions.size} test transactions`);

        const deletePromises = Array.from(uniqueTransactions.values()).map(docSnapshot => {
            const data = docSnapshot.data();
            console.log(`  - Deleting transaction: ${data.billNo || docSnapshot.id} (${data.type}) - ${data.partyName || 'N/A'}`);
            return deleteDoc(doc(db, 'transactions', docSnapshot.id));
        });

        await Promise.all(deletePromises);
        console.log(`  ✓ Deleted ${uniqueTransactions.size} test transactions\n`);
        return Array.from(uniqueTransactions.keys());
    } catch (error) {
        console.error('  ❌ Error cleaning up test transactions:', error);
        return [];
    }
}

/**
 * Delete all notifications associated with test users OR deleted transactions
 */
async function cleanupTestNotifications(testUserIds: TestUserIds, deletedTransactionIds: string[]): Promise<number> {
    try {
        const notificationsRef = collection(db, 'notifications');

        // Query for notifications by test customer
        const customerQuery = query(notificationsRef, where('targetUserId', '==', testUserIds.customerId));
        const customerSnapshot = await getDocs(customerQuery);

        // Query for notifications by test admin
        const adminQuery = query(notificationsRef, where('targetUserId', '==', testUserIds.adminId));
        const adminSnapshot = await getDocs(adminQuery);

        // Query for notifications related to deleted transactions
        // Note: 'in' query allows up to 10 values. If we have more, we need to batch or just get all and filter in memory.
        // Given this is a cleanup script, let's fetch all notifications and filter in memory to be safe and simple
        // (assuming notification count isn't massive yet, or we could optimize later)
        const allNotificationsSnapshot = await getDocs(notificationsRef);
        const relatedNotifications = allNotificationsSnapshot.docs.filter(doc => {
            const data = doc.data();
            const message = data.message || '';
            const isRelatedToTransaction = deletedTransactionIds.includes(data.relatedEntityId) && data.relatedEntityType === 'transaction';
            const isTriggeredByTestAdmin = message.includes('Test Admin') || message.includes('Triggered by: Test Admin') || message.includes('Updated by: Test Admin');

            return isRelatedToTransaction || isTriggeredByTestAdmin;
        });

        // Combine all unique notifications to delete
        const notificationsToDelete = new Map(); // Map prevents duplicates
        customerSnapshot.docs.forEach(doc => notificationsToDelete.set(doc.id, doc));
        adminSnapshot.docs.forEach(doc => notificationsToDelete.set(doc.id, doc));
        relatedNotifications.forEach(doc => notificationsToDelete.set(doc.id, doc));

        const totalDocs = notificationsToDelete.size;

        if (totalDocs === 0) {
            console.log('  No test notifications found');
            return 0;
        }

        console.log(`  Found ${totalDocs} test notifications`);

        const deletePromises = Array.from(notificationsToDelete.values()).map(docSnapshot => {
            const data = docSnapshot.data();
            console.log(`  - Deleting notification: ${docSnapshot.id} (${data.title})`);
            return deleteDoc(doc(db, 'notifications', docSnapshot.id));
        });

        await Promise.all(deletePromises);
        console.log(`  ✓ Deleted ${totalDocs} test notifications\n`);
        return totalDocs;
    } catch (error) {
        console.error('  ❌ Error cleaning up test notifications:', error);
        return 0;
    }
}

/**
 * Main cleanup function
 */
async function main() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         🧹 TEST DATA CLEANUP SCRIPT                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Get test user IDs first
        const testUserIds = await getTestUserIds();

        if (!testUserIds.adminId || !testUserIds.customerId) {
            console.error('❌ Could not retrieve test user IDs. Aborting cleanup.');
            process.exit(1);
        }

        // Track total deletions
        let totalDeleted = 0;

        // Run all cleanup functions
        console.log('📦 Cleaning up test categories...');
        totalDeleted += await cleanupTestCategories();

        console.log('🛍️  Cleaning up test products...');
        totalDeleted += await cleanupTestProducts();

        console.log('📋 Cleaning up test transactions...');
        const deletedTransactionIds = await cleanupTestTransactions(testUserIds);
        totalDeleted += deletedTransactionIds.length;

        console.log('🔔 Cleaning up test notifications...');
        totalDeleted += await cleanupTestNotifications(testUserIds, deletedTransactionIds);

        // Summary
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                    CLEANUP SUMMARY                         ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log(`  Total items deleted: ${totalDeleted}`);
        console.log('\n✅ Test data cleanup completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during test data cleanup:', error);
        process.exit(1);
    }
}

// Run the script
main();
