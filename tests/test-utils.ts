import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Get Firebase UIDs for test users
 */
export async function getTestUserIds(): Promise<{ adminId: string; customerId: string }> {
    const testUsers = [
        { email: 'test-admin@greenbird.com', password: 'password123!' },
        { email: 'test-customer@greenbird.com', password: 'password123!' }
    ];

    const ids = { adminId: '', customerId: '' };

    try {
        // Sign in as test admin to get UID
        const adminCred = await signInWithEmailAndPassword(auth, testUsers[0].email, testUsers[0].password);
        ids.adminId = adminCred.user.uid;

        // Sign in as test customer to get UID
        const customerCred = await signInWithEmailAndPassword(auth, testUsers[1].email, testUsers[1].password);
        ids.customerId = customerCred.user.uid;

        console.log('Test user IDs retrieved:', ids);
    } catch (error) {
        console.error('Error getting test user IDs:', error);
    }

    return ids;
}

/**
 * Delete all categories with name "Test Category"
 */
export async function cleanupTestCategories(): Promise<void> {
    try {
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, where('name', '==', 'Test Category'));
        const querySnapshot = await getDocs(q);

        console.log(`Found ${querySnapshot.size} test categories to delete`);

        const deletePromises = querySnapshot.docs.map(docSnapshot =>
            deleteDoc(doc(db, 'categories', docSnapshot.id))
        );

        await Promise.all(deletePromises);
        console.log('✓ Test categories cleaned up');
    } catch (error) {
        console.error('Error cleaning up test categories:', error);
    }
}

/**
 * Delete all products with name "Test Product"
 */
export async function cleanupTestProducts(): Promise<void> {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('name', '==', 'Test Product'));
        const querySnapshot = await getDocs(q);

        console.log(`Found ${querySnapshot.size} test products to delete`);

        const deletePromises = querySnapshot.docs.map(docSnapshot =>
            deleteDoc(doc(db, 'products', docSnapshot.id))
        );

        await Promise.all(deletePromises);
        console.log('✓ Test products cleaned up');
    } catch (error) {
        console.error('Error cleaning up test products:', error);
    }
}

/**
 * Delete all transactions associated with test users
 */
export async function cleanupTestTransactions(testUserIds: { adminId: string; customerId: string }): Promise<void> {
    try {
        const transactionsRef = collection(db, 'transactions');

        // Query for transactions by test customer
        const customerQuery = query(transactionsRef, where('customerId', '==', testUserIds.customerId));
        const customerSnapshot = await getDocs(customerQuery);

        // Query for transactions by test admin (if any)
        const adminQuery = query(transactionsRef, where('customerId', '==', testUserIds.adminId));
        const adminSnapshot = await getDocs(adminQuery);

        const totalDocs = customerSnapshot.size + adminSnapshot.size;
        console.log(`Found ${totalDocs} test transactions to delete`);

        const deletePromises = [
            ...customerSnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(db, 'transactions', docSnapshot.id))
            ),
            ...adminSnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(db, 'transactions', docSnapshot.id))
            )
        ];

        await Promise.all(deletePromises);
        console.log('✓ Test transactions cleaned up');
    } catch (error) {
        console.error('Error cleaning up test transactions:', error);
    }
}

/**
 * Delete all notifications associated with test users
 */
export async function cleanupTestNotifications(testUserIds: { adminId: string; customerId: string }): Promise<void> {
    try {
        const notificationsRef = collection(db, 'notifications');

        // Query for notifications by test customer
        const customerQuery = query(notificationsRef, where('targetUserId', '==', testUserIds.customerId));
        const customerSnapshot = await getDocs(customerQuery);

        // Query for notifications by test admin
        const adminQuery = query(notificationsRef, where('targetUserId', '==', testUserIds.adminId));
        const adminSnapshot = await getDocs(adminQuery);

        const totalDocs = customerSnapshot.size + adminSnapshot.size;
        console.log(`Found ${totalDocs} test notifications to delete`);

        const deletePromises = [
            ...customerSnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(db, 'notifications', docSnapshot.id))
            ),
            ...adminSnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(db, 'notifications', docSnapshot.id))
            )
        ];

        await Promise.all(deletePromises);
        console.log('✓ Test notifications cleaned up');
    } catch (error) {
        console.error('Error cleaning up test notifications:', error);
    }
}

/**
 * Master cleanup function - deletes all test data
 */
export async function cleanupAllTestData(): Promise<void> {
    console.log('\n🧹 Starting test data cleanup...\n');

    try {
        // Get test user IDs first
        const testUserIds = await getTestUserIds();

        if (!testUserIds.adminId || !testUserIds.customerId) {
            console.warn('⚠️  Could not retrieve test user IDs. Skipping user-specific cleanup.');
        }

        // Run all cleanup functions
        await Promise.all([
            cleanupTestCategories(),
            cleanupTestProducts(),
            testUserIds.adminId && testUserIds.customerId
                ? cleanupTestTransactions(testUserIds)
                : Promise.resolve(),
            testUserIds.adminId && testUserIds.customerId
                ? cleanupTestNotifications(testUserIds)
                : Promise.resolve()
        ]);

        console.log('\n✅ Test data cleanup completed successfully\n');
    } catch (error) {
        console.error('\n❌ Error during test data cleanup:', error, '\n');
    }
}
