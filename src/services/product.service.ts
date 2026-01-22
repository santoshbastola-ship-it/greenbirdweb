import { collection, getDocs, doc, getDoc, query, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StockHistoryEntry } from "@/types";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

const COLLECTION_NAME = "products";

export const ProductService = {
    getAllProducts: async (): Promise<Product[]> => {
        try {
            // Check if API key is present, if not, use mock
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                console.log("Using Mock Data (No API Key)");
                return MOCK_PRODUCTS;
            }

            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            if (querySnapshot.empty) {
                return MOCK_PRODUCTS; // Fallback if DB is empty
            }
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching products:", error);
            return MOCK_PRODUCTS; // Fallback on error
        }
    },

    getProductById: async (id: string): Promise<Product | null> => {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                return MOCK_PRODUCTS.find(p => p.id === id) || null;
            }

            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Product;
            } else {
                // Fallback to mock search in case we are in hybrid mode (or id is from mock)
                return MOCK_PRODUCTS.find(p => p.id === id) || null;
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            return MOCK_PRODUCTS.find(p => p.id === id) || null;
        }
    },

    getProductsByCategory: async (category: string): Promise<Product[]> => {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                return MOCK_PRODUCTS.filter(p => p.businessType === category);
            }

            const q = query(collection(db, COLLECTION_NAME), where("businessType", "==", category));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching category:", error);
            return MOCK_PRODUCTS.filter(p => p.businessType === category);
        }
    },

    async updateProductStock(
        productId: string,
        action: 'add' | 'remove' | 'set',
        quantity: number,
        note?: string
    ): Promise<void> {
        // 1. Get current product
        const product = await this.getProductById(productId);
        if (!product) throw new Error("Product not found");

        // 2. Calculate new stock
        let newStock = product.currentStock;
        let changeAmount = 0;

        if (action === 'add') {
            newStock += quantity;
            changeAmount = quantity;
        } else if (action === 'remove') {
            newStock -= quantity;
            changeAmount = -quantity;
        } else if (action === 'set') {
            changeAmount = quantity - newStock;
            newStock = quantity;
        }

        if (newStock < 0) newStock = 0; // Prevent negative stock

        // 3. Create history entry
        const historyEntry: StockHistoryEntry = {
            id: Math.random().toString(36).substr(2, 9),
            productId: productId,
            oldStock: product.currentStock,
            newStock: newStock,
            changeAmount: changeAmount,
            actionType: action,
            date: new Date().toISOString(),
            changedBy: "admin", // TODO: Get actual user ID
            note: note
        };

        // 4. Update Persistence (Mock or Firebase)
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                // Mock Update
                const index = MOCK_PRODUCTS.findIndex(p => p.id === productId);
                if (index !== -1) {
                    MOCK_PRODUCTS[index] = {
                        ...MOCK_PRODUCTS[index],
                        currentStock: newStock,
                        stockHistory: [historyEntry, ...(MOCK_PRODUCTS[index].stockHistory || [])]
                    };
                }
            } else {
                // Firebase Update
                // Note: In a real app, this should be a transaction to ensure atomicity
                const docRef = doc(db, COLLECTION_NAME, productId);
                const currentHistory = product.stockHistory || [];

                await updateDoc(docRef, {
                    currentStock: newStock,
                    stockHistory: [historyEntry, ...currentHistory]
                });
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            throw error;
        }
    }
};
