import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    orderBy,
    limit,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { Testimonial } from "@/types/extra";

const COLLECTION_NAME = "testimonials";

export const getTestimonials = async (maxResult: number = 20): Promise<Testimonial[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("date", "desc"),
            limit(maxResult)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            } as Testimonial;
        });
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        throw error;
    }
};

export const addTestimonial = async (testimonial: Omit<Testimonial, "id">): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...testimonial,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding testimonial:", error);
        throw error;
    }
};

export const updateTestimonialStatus = async (id: string, isPublished: boolean): Promise<void> => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, id), {
            isPublished
        });
    } catch (error) {
        console.error("Error updating testimonial status:", error);
        throw error;
    }
};

export const deleteTestimonial = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        throw error;
    }
};

export const uploadTestimonialPhoto = async (file: File): Promise<string> => {
    try {
        const storageRef = ref(storage, `${COLLECTION_NAME}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading photo:", error);
        throw error;
    }
};
