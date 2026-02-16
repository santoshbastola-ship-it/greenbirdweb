import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSettings } from "@/types";
import { NotificationService } from "./notification.service";

const COLLECTION_NAME = "settings";
const DOCUMENT_ID = "global";

const DEFAULT_SETTINGS: AppSettings = {
    deliveryFee: 75,
    freeDeliveryThreshold: 750,

    // App Discount
    enableAppDiscount: true, // Default to true for backward compatibility if you wish, or false. Keeping existing behavior implies enabled.
    appDiscountPercentage: 5,
    minAppDiscount: 10,
    // Dates default to undefined (always valid if enabled)

    // First Order Discount
    enableFirstOrderDiscount: false,
    firstOrderDiscountAmount: 0,
    firstOrderCountThreshold: 1, // Default: First 1 order
    whatsappBotNumber: "9779800000000",
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

    updateSettings: async (settings: AppSettings, triggeredBy?: string): Promise<void> => {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                console.warn("Cannot update settings without Firebase API Key (Mock Mode)");
                return;
            }

            // Fetch old settings to compare
            const oldSettings = await SettingsService.getSettings();

            const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
            await setDoc(docRef, settings, { merge: true });

            // Calculate changes
            const changes: string[] = [];
            const keys = new Set([...Object.keys(oldSettings), ...Object.keys(settings)]) as Set<keyof AppSettings>;

            keys.forEach(key => {
                const oldValue = oldSettings[key];
                const newValue = settings[key];

                if (oldValue !== newValue) {
                    // Format key for better readability (camelCase to Title Case)
                    const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                    changes.push(`${formattedKey}: ${oldValue} -> ${newValue}`);
                }
            });

            const changesText = changes.length > 0 ? changes.join('\n') : "No specific changes detected.";

            let message = `App global settings have been updated.\n\nChanges:\n${changesText}`;
            if (triggeredBy) {
                message += `\n\nUpdated by: ${triggeredBy}`;
            }

            // Notify Admins
            await NotificationService.notifyAdmins(
                "Settings Updated",
                message,
                "global",
                'setting',
                '/admin/settings',
                undefined // We manually added triggeredBy to the message for better formatting
            );
        } catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    }
};
