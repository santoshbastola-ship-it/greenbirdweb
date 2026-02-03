import { collection, getDocs, doc, getDoc, query, where, updateDoc, deleteDoc, addDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category } from "@/types";

const COLLECTION_NAME = "categories";

export const CategoryService = {
    getAllCategories: async (): Promise<Category[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        } catch (error) {
            console.error("Error fetching categories:", error);
            return [];
        }
    },

    getActiveCategories: async (): Promise<Category[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("isActive", "==", true),
                orderBy("name", "asc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        } catch (error) {
            console.error("Error fetching active categories:", error);
            return [];
        }
    },

    getCategoryById: async (id: string): Promise<Category | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Category;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching category:", error);
            return null;
        }
    },

    createCategory: async (category: Partial<Category>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...category,
                isActive: category.isActive !== undefined ? category.isActive : true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating category:", error);
            throw error;
        }
    },

    updateCategory: async (id: string, updates: Partial<Category>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error updating category:", error);
            throw error;
        }
    },

    deleteCategory: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting category:", error);
            throw error;
        }
    }
};
