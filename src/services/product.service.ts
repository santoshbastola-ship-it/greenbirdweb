import { collection, getDocs, doc, getDoc, query, where, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Product, StockHistoryEntry } from "@/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const COLLECTION_NAME = "products";

export const ProductService = {
    getAllProducts: async (): Promise<Product[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    getProductById: async (id: string): Promise<Product | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Product;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            return null;
        }
    },

    getProductsByCategory: async (category: string): Promise<Product[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), where("businessType", "==", category));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching category:", error);
            return [];
        }
    },

    createProduct: async (product: Partial<Product>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...product,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    },

    updateProduct: async (id: string, product: Partial<Product>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...product,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    uploadProductImage: async (file: File): Promise<string> => {
        try {
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
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

        // 4. Update Persistence (Firebase)
        try {
            // Firebase Update
            // Note: In a real app, this should be a transaction to ensure atomicity
            const docRef = doc(db, COLLECTION_NAME, productId);
            const currentHistory = product.stockHistory || [];

            await updateDoc(docRef, {
                currentStock: newStock,
                stockHistory: [historyEntry, ...currentHistory]
            });
        } catch (error) {
            console.error("Error updating stock:", error);
            throw error;
        }
    },

    deleteProduct: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    }
};
