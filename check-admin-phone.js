// Quick script to check admin phone numbers in Firestore
const admin = require('firebase-admin');

// Initialize Firebase Admin (uses default credentials)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'greenbird-56584'
    });
}

const db = admin.firestore();

async function checkAdminPhones() {
    try {
        const adminsSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();

        console.log('\n=== ADMIN USERS ===');
        console.log(`Found ${adminsSnapshot.size} admin(s)\n`);

        adminsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`Name: ${data.name || 'N/A'}`);
            console.log(`Email: ${data.email || 'N/A'}`);
            console.log(`Phone: ${data.phoneNumber || 'NOT SET'}`);
            console.log(`Role: ${data.role}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdminPhones();
