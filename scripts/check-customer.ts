import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./src/lib/firebase";

async function checkCustomer(name) {
    console.log(`Searching for customer: ${name}`);
    const q = query(collection(db, "partners"), where("name", "==", name));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Not found in partners collection.");
        // Try users collection
        const q2 = query(collection(db, "users"), where("name", "==", name));
        const snap2 = await getDocs(q2);
        if (snap2.empty) {
            console.log("Not found in users collection either.");
        } else {
            console.log(`Found in users collection: ${snap2.docs.length} matches`);
            snap2.forEach(doc => console.log(doc.id, doc.data()));
        }
    } else {
        console.log(`Found in partners collection: ${querySnapshot.docs.length} matches`);
        querySnapshot.forEach(doc => console.log(doc.id, doc.data()));
    }
}

const nameToCheck = process.argv[2] || "RandomGhattaghar";
checkCustomer(nameToCheck).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
