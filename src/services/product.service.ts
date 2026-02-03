import { collection, getDocs, doc, getDoc, query, where, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Product, StockHistoryEntry, PriceHistoryEntry } from "@/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { NotificationService } from "./notification.service";

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

    createProduct: async (product: Partial<Product>, changedBy: string = "admin"): Promise<string> => {
        try {
            const initialHistory: PriceHistoryEntry[] = product.currentPrice !== undefined ? [{
                price: product.currentPrice,
                date: new Date().toISOString(),
                changedBy: changedBy
            }] : [];

            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...product,
                priceHistory: initialHistory,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // Notify Admins
            await NotificationService.notifyAdmins(
                "New Product Created",
                `New product created: ${product.name}`,
                docRef.id,
                'product',
                '/admin/inventory'
            );
            return docRef.id;
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    },

    updateProduct: async (id: string, updates: Partial<Product>, changedBy: string = "admin"): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);

            // If currentPrice is being updated, we need to track it
            if (updates.currentPrice !== undefined) {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const oldProduct = docSnap.data() as Product;
                    if (oldProduct.currentPrice !== updates.currentPrice) {
                        const historyEntry: PriceHistoryEntry = {
                            price: updates.currentPrice,
                            date: new Date().toISOString(),
                            changedBy: changedBy
                        };
                        const currentHistory = oldProduct.priceHistory || [];
                        updates.priceHistory = [historyEntry, ...currentHistory];
                    }
                }
            }

            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });

            // Notify Admins
            await NotificationService.notifyAdmins(
                "Product Updated",
                `Product updated: ${id}`,
                id,
                'product',
                '/admin/inventory'
            );
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    uploadProductImage: async (file: File): Promise<string> => {
        try {
            console.log("Starting image upload for file:", file.name, "type:", file.type, "size:", file.size);
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log("Image upload successful. URL:", downloadURL);
            return downloadURL;
        } catch (error: any) {
            console.error("Error uploading image to Firebase Storage:", error);
            // Re-throw with more context
            const errorMessage = error.message || "Unknown error during upload";
            throw new Error(`Upload failed: ${errorMessage}`);
        }
    },

    async updateProductStock(
        productId: string,
        action: 'add' | 'remove' | 'set',
        quantity: number,
        note?: string,
        changedBy: string = "admin", // Default for backward compatibility or system updates
        changedByUserId?: string
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
            changedBy: changedBy,
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

            // 5. Send Notification
            if (changedByUserId) {
                await NotificationService.createNotification({
                    targetUserId: changedByUserId,
                    title: "Stock Updated",
                    message: `Stock for ${product.name} updated. New stock: ${newStock} ${product.unit} (${action === 'add' ? '+' : action === 'remove' ? '-' : '='}${Math.abs(changeAmount)})`,
                    type: "info",
                    channels: ["in-app"],
                    route: "/admin/stock-update"
                });
            }

        } catch (error) {
            console.error("Error updating stock:", error);
            throw error;
        }
    },

    deleteProduct: async (id: string): Promise<void> => {
        try {
            // Fetch product first to get the name for notification
            const productRef = doc(db, COLLECTION_NAME, id);
            const productSnap = await getDoc(productRef);
            let productName = id;
            if (productSnap.exists()) {
                productName = (productSnap.data() as Product).name;
            }

            await deleteDoc(productRef);

            // Notify Admins
            await NotificationService.notifyAdmins(
                "Product Deleted",
                `Product deleted: ${productName}`,
                undefined,
                'product',
                '/admin/inventory'
            );
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    },

    getFeaturedProducts: async (): Promise<Product[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), where("isFeatured", "==", true));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching featured products:", error);
            return [];
        }
    }
};
