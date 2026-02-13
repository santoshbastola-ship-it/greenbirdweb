
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
// Fallback to .env
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

import { db } from "../src/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

async function checkData() {
    try {
        console.log("Firebase initialized. Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

        console.log("Fetching categories...");
        const catSnapshot = await getDocs(collection(db, "categories"));
        const categories = catSnapshot.docs.map(doc => {
            const data = doc.data() as any;
            return { id: doc.id, name: data.name, ...data };
        });

        // Check for "sun dried" related categories
        const relevantCats = categories.filter((c: any) =>
            (c.name && c.name.toLowerCase().includes("sun")) ||
            (c.id && c.id.toLowerCase().includes("sun"))
        );

        console.log(`Found ${relevantCats.length} categories matching 'sun':`);
        relevantCats.forEach((c: any) => console.log(`- ${c.name} (ID: ${c.id})`));

        for (const cat of relevantCats) {
            console.log(`\nFetching products for category ID: ${cat.id} (${cat.name})`);
            const prodSnapshot = await getDocs(query(collection(db, "products"), where("categoryId", "==", cat.id)));
            const products = prodSnapshot.docs.map(doc => {
                const data = doc.data() as any;
                return {
                    id: doc.id,
                    name: data.name,
                    categoryId: data.categoryId,
                    showInApp: data.showInApp,
                    isAvailableForSale: data.isAvailableForSale, // Check availability too
                    businessType: data.businessType // Check business type
                };
            });
            console.log(`Found ${products.length} products for this category.`);
            products.forEach((p: any) => {
                console.log(`  - ${p.name} (CatID: ${p.categoryId})`);
                console.log(`    showInApp: ${p.showInApp}`);
                console.log(`    isAvailableForSale: ${p.isAvailableForSale}`);
                console.log(`    businessType: ${p.businessType}`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkData();
