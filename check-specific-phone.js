const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'greenbird-56584'
    });
}

const db = admin.firestore();

async function checkUser() {
    try {
        const phone = '977984985000';
        console.log(`Searching for phone: ${phone}`);

        // Try multiple variations
        const variations = [phone, `+${phone}`, '984985000'];

        for (const v of variations) {
            const snap = await db.collection('users').where('phoneNumber', '==', v).get();
            if (!snap.empty) {
                console.log(`Found user(s) with phoneNumber: ${v}`);
                snap.forEach(doc => {
                    console.log(`ID: ${doc.id}, Name: ${doc.data().name}, Role: ${doc.data().role}`);
                });
            }

            const snap2 = await db.collection('users').where('phone', '==', v).get();
            if (!snap2.empty) {
                console.log(`Found user(s) with phone: ${v}`);
                snap2.forEach(doc => {
                    console.log(`ID: ${doc.id}, Name: ${doc.data().name}, Role: ${doc.data().role}`);
                });
            }
        }

        // Also check interactions
        const intSnap = await db.collection('whatsapp_interactions').doc(phone).get();
        if (intSnap.exists) {
            console.log('Interaction window exists for this number.');
            console.log('Data:', intSnap.data());
        } else {
            console.log('No interaction window found for this number.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
