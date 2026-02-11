import { collection, getDocs, doc, getDoc, query, where, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Product, StockHistoryEntry, PriceHistoryEntry } from "@/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { NotificationService } from "./notification.service";
import { optimizeImage } from "@/lib/image-optimizer";

const COLLECTION_NAME = "products";

export const ProductService = {
    getAllProducts: async (): Promise<Product[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

            // Fetch categories to map names
            const categories = await ProductService.getCategories();
            const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

            return products.map(p => ({
                ...p,
                images: Array.isArray(p.images) ? p.images : [],
                categoryName: p.categoryId ? categoryMap.get(p.categoryId) : undefined
            }));
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    getCategories: async () => {
        const querySnapshot = await getDocs(collection(db, "categories"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    },

    getProductById: async (id: string): Promise<Product | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const product = { id: docSnap.id, ...docSnap.data() } as Product;
                if (product.categoryId) {
                    const catRef = doc(db, "categories", product.categoryId);
                    const catSnap = await getDoc(catRef);
                    if (catSnap.exists()) {
                        product.categoryName = catSnap.data().name;
                    }
                }
                // Normalize images
                product.images = Array.isArray(product.images) ? product.images : [];
                return product;
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
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                images: Array.isArray((doc.data() as any).images) ? (doc.data() as any).images : []
            } as Product));
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

            // Sanitize product data (remove undefined)
            const cleanProduct = JSON.parse(JSON.stringify(product));

            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...cleanProduct,
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
                '/admin/inventory',
                changedBy
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
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error("Product not found");
            }

            const oldProduct = docSnap.data() as Product;
            const productName = oldProduct.name;
            const changes: string[] = [];

            // If currentPrice is being updated, we need to track it
            if (updates.currentPrice !== undefined && updates.currentPrice !== oldProduct.currentPrice) {
                changes.push(`price: Rs ${oldProduct.currentPrice} -> Rs ${updates.currentPrice}`);
                const historyEntry: PriceHistoryEntry = {
                    price: updates.currentPrice,
                    date: new Date().toISOString(),
                    changedBy: changedBy
                };
                const currentHistory = oldProduct.priceHistory || [];
                updates.priceHistory = [historyEntry, ...currentHistory];
            }

            if (updates.currentStock !== undefined && updates.currentStock !== oldProduct.currentStock) {
                changes.push(`stock: ${oldProduct.currentStock} -> ${updates.currentStock}`);
            }

            if (updates.isAvailableForSale !== undefined && updates.isAvailableForSale !== oldProduct.isAvailableForSale) {
                changes.push(`status: ${oldProduct.isAvailableForSale ? 'In Stock' : 'Out of Stock'} -> ${updates.isAvailableForSale ? 'In Stock' : 'Out of Stock'}`);
            }

            if (updates.name !== undefined && updates.name !== oldProduct.name) {
                changes.push(`name: ${oldProduct.name} -> ${updates.name}`);
            }

            if (updates.showInApp !== undefined && updates.showInApp !== oldProduct.showInApp) {
                changes.push(`App Visibility: ${oldProduct.showInApp !== false ? 'Visible' : 'Hidden'} -> ${updates.showInApp ? 'Visible' : 'Hidden'}`);
            }

            if (updates.discount !== undefined) {
                const oldDiscount = oldProduct.discount;
                const newDiscount = updates.discount;
                if (JSON.stringify(oldDiscount) !== JSON.stringify(newDiscount)) {
                    if (!newDiscount) {
                        changes.push(`discount: removed`);
                    } else {
                        const type = newDiscount.type;
                        const value = newDiscount.value;
                        changes.push(`discount: ${type} ${value}${type === 'percentage' ? '%' : ' Rs'}`);
                    }
                }
            }

            // Sanitize updates (remove undefined)
            const cleanUpdates = JSON.parse(JSON.stringify(updates));

            await updateDoc(docRef, {
                ...cleanUpdates,
                updatedAt: new Date().toISOString(),
            });

            // Notify Admins
            const timestamp = new Date().toLocaleString();
            const changesSummary = changes.length > 0 ? `(${changes.join(', ')})` : '(details updated)';
            const message = `Product updated: ${productName} ${changesSummary}`;

            await NotificationService.notifyAdmins(
                "Product Updated",
                message,
                id,
                'product',
                '/admin/inventory',
                changedBy
            );
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    uploadProductImage: async (file: File): Promise<string> => {
        try {
            console.log("Starting image upload for file:", file.name, "type:", file.type, "size:", file.size);

            // Optimize image before upload
            const optimizedFile = await optimizeImage(file, 'product');

            const storageRef = ref(storage, `products/${Date.now()}_${optimizedFile.name.split('.')[0]}.webp`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
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

            // Sanitize history entry
            const cleanHistoryEntry = JSON.parse(JSON.stringify(historyEntry));

            await updateDoc(docRef, {
                currentStock: newStock,
                stockHistory: [cleanHistoryEntry, ...currentHistory]
            });

            // 5. Send Notification
            const timestamp = new Date().toLocaleString();
            const actionText = action === 'add' ? 'added' : action === 'remove' ? 'removed' : 'set';
            const message = `Product updated: ${product.name} (stock updated: ${actionText} ${quantity} ${product.unit}, New total: ${newStock} ${product.unit})`;

            console.log(`[ProductService] Sending stock update notification for product ${product.name} (${productId})`);

            // Notify Admins
            await NotificationService.notifyAdmins(
                "Stock Updated",
                message,
                productId,
                'product',
                '/admin/inventory',
                changedBy
            );
            console.log(`[ProductService] Stock update notification sent successfully.`);

        } catch (error) {
            console.error("Error updating stock:", error);
            throw error;
        }
    },

    deleteProduct: async (id: string, changedBy: string = "admin"): Promise<void> => {
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
            const timestamp = new Date().toLocaleString();
            const message = `Product deleted: ${productName}`;

            await NotificationService.notifyAdmins(
                "Product Deleted",
                message,
                undefined,
                'product',
                '/admin/inventory',
                changedBy
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
            let featuredProducts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                images: Array.isArray((doc.data() as any).images) ? (doc.data() as any).images : []
            } as Product));

            // Fallback: If no featured products found via query, but there might be some that are not indexed properly
            if (featuredProducts.length === 0) {
                console.log("No featured products found via query, trying client-side filter as fallback...");
                const allProducts = await ProductService.getAllProducts();
                featuredProducts = allProducts.filter(p => p.isFeatured === true);
            }

            // Map category names if they are missing
            if (featuredProducts.length > 0) {
                const categories = await ProductService.getCategories();
                const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
                featuredProducts = featuredProducts.map(p => ({
                    ...p,
                    categoryName: p.categoryId ? categoryMap.get(p.categoryId) : p.categoryName
                }));
            }

            return featuredProducts;
        } catch (error) {
            console.error("Error fetching featured products:", error);
            // Final fallback to all products filter
            try {
                const allProducts = await ProductService.getAllProducts();
                return allProducts.filter(p => p.isFeatured === true);
            } catch (fallbackError) {
                return [];
            }
        }
    }
};
