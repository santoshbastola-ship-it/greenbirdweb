import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "./src/lib/firebase";

async function listRecentTransactions() {
    console.log("Fetching recent transactions...");
    const q = query(collection(db, "transactions"), orderBy("entryTimestamp", "desc"), limit(20));
    const snap = await getDocs(q);

    snap.forEach(doc => {
        const data = doc.data();
        console.log(`[${doc.id}] Party: ${data.partyName}, CustomerId: ${data.customerId}, Total: ${data.totalAmount}`);
    });
}

listRecentTransactions().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
