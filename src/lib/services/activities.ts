import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    orderBy,
    limit,
    Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { FarmActivity } from "@/types/extra";
import { NotificationService } from "@/services/notification.service";

const COLLECTION_NAME = "farm_activities";

export const getActivities = async (maxResult: number = 20): Promise<FarmActivity[]> => {
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
                isPublished: data.isPublished !== undefined ? data.isPublished : true,
                media: data.media || (data.imageUrl ? [{ url: data.imageUrl, type: 'image' }] : []),
                date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            } as FarmActivity;
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        throw error;
    }
};

export const addActivity = async (activity: Omit<FarmActivity, "id">): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...activity,
            isPublished: activity.isPublished ?? true,
            createdAt: Timestamp.now(),
        });

        // Notify Admins
        await NotificationService.notifyAdmins(
            "New Farm Activity",
            `New activity added: ${activity.title}`,
            docRef.id,
            'activity',
            '/admin/activities'
        );

        return docRef.id;
    } catch (error) {
        console.error("Error adding activity:", error);
        throw error;
    }
};

export const updateActivityStatus = async (id: string, isPublished: boolean): Promise<void> => {
    try {
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, COLLECTION_NAME, id), {
            isPublished
        });

        // Notify Admins
        await NotificationService.notifyAdmins(
            "Activity Status Updated",
            `Activity ${id} status updated to ${isPublished ? 'Published' : 'Draft'}`,
            id,
            'activity',
            '/admin/activities'
        );
    } catch (error) {
        console.error("Error updating activity status:", error);
        throw error;
    }
};

export const deleteActivity = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));

        // Notify Admins
        await NotificationService.notifyAdmins(
            "Activity Deleted",
            `Activity deleted: ${id}`,
            undefined,
            'activity',
            '/admin/activities'
        );
    } catch (error) {
        console.error("Error deleting activity:", error);
        throw error;
    }
};

export const uploadActivityImage = async (file: File): Promise<string> => {
    try {
        const storageRef = ref(storage, `${COLLECTION_NAME}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

export const uploadMedia = async (file: File): Promise<{ url: string, type: 'image' | 'video' }> => {
    try {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const storageRef = ref(storage, `${COLLECTION_NAME}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return { url, type };
    } catch (error) {
        console.error("Error uploading media:", error);
        throw error;
    }
};
