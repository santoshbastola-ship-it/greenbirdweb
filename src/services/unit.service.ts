import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Unit } from "@/types";

const COLLECTION_NAME = "units";

export const UnitService = {
    getAllUnits: async (): Promise<Unit[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            } as Unit)).sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Error fetching units:", error);
            throw error;
        }
    },

    getActiveUnits: async (): Promise<Unit[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("isActive", "==", true)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            } as Unit)).sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Error fetching active units:", error);
            throw error;
        }
    },

    createUnit: async (unitData: Partial<Unit>): Promise<string> => {
        try {
            const data = {
                ...unitData,
                isActive: unitData.isActive ?? true,
                allowDecimals: unitData.allowDecimals ?? true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
            return docRef.id;
        } catch (error) {
            console.error("Error creating unit:", error);
            throw error;
        }
    },

    updateUnit: async (id: string, unitData: Partial<Unit>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...unitData,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error updating unit:", error);
            throw error;
        }
    },

    deleteUnit: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting unit:", error);
            throw error;
        }
    }
};
