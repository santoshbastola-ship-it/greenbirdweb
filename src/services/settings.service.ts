import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSettings } from "@/types";
import { NotificationService } from "./notification.service";

const COLLECTION_NAME = "settings";
const DOCUMENT_ID = "global";

const DEFAULT_SETTINGS: AppSettings = {
    deliveryFee: 75,
    freeDeliveryThreshold: 750,
    appDiscountPercentage: 5,
    minAppDiscount: 10
};

export const SettingsService = {
    getSettings: async (): Promise<AppSettings> => {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                return DEFAULT_SETTINGS;
            }

            const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { ...DEFAULT_SETTINGS, ...docSnap.data() } as AppSettings;
            }
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error("Error fetching settings:", error);
            return DEFAULT_SETTINGS;
        }
    },

    updateSettings: async (settings: AppSettings): Promise<void> => {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                console.warn("Cannot update settings without Firebase API Key (Mock Mode)");
                return;
            }

            const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
            await setDoc(docRef, settings, { merge: true });

            // Notify Admins
            await NotificationService.notifyAdmins(
                "Settings Updated",
                "App global settings have been updated.",
                "global",
                'setting',
                '/admin/settings'
            );
        } catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    }
};
