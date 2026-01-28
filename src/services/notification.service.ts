import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notification, NotificationType, NotificationChannel } from "@/types";

const COLLECTION_NAME = "notifications";
const WHATSAPP_LOGS_COLLECTION = "whatsapp_logs";

export const NotificationService = {
    // Create a new notification
    createNotification: async (notification: Omit<Notification, "id" | "isRead" | "createdAt">): Promise<string> => {
        try {
            const newNotification = {
                ...notification,
                isRead: false,
                createdAt: new Date().toISOString(), // Use string for serializability
                timestamp: Timestamp.now(), // Use Firestore Timestamp for efficient querying
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), newNotification);

            // If channel includes WhatsApp, try to send it
            if (notification.channels?.includes('whatsapp')) {
                await NotificationService.sendWhatsappNotification(notification.targetUserId, notification.title, notification.message);
            }

            return docRef.id;
        } catch (error) {
            console.error("Error creating notification:", error);
            // Don't throw, just log. Notifications shouldn't break the main flow.
            return "";
        }
    },

    // Get notifications for a specific user
    getUserNotifications: async (userId: string, limitCount: number = 20): Promise<Notification[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("targetUserId", "==", userId),
                orderBy("timestamp", "desc"),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure dates are parsed correctly if needed, though we store as ISO strings usually
                } as Notification;
            });
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
    },

    // Mark notification as read
    markAsRead: async (id: string): Promise<void> => {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, id), {
                isRead: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    },

    // Mark all as read for a user
    markAllAsRead: async (userId: string): Promise<void> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("targetUserId", "==", userId),
                where("isRead", "==", false)
            );
            const querySnapshot = await getDocs(q);
            const updatePromises = querySnapshot.docs.map(d => updateDoc(d.ref, { isRead: true }));
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    },

    // STUB: Send WhatsApp Notification
    sendWhatsappNotification: async (to: string, title: string, body: string): Promise<void> => {
        // In a real app, this would call an API (Twilio, Interakt, WhatsApp Cloud API)
        // For now, we simulate by logging and saving to a separate collection.

        console.log(`[WHATSAPP STUB] Sending to ${to}: ${title} - ${body}`);

        try {
            await addDoc(collection(db, WHATSAPP_LOGS_COLLECTION), {
                to,
                title,
                body,
                sentAt: new Date().toISOString(),
                status: 'simulated'
            });
        } catch (error) {
            console.error("Error logging WhatsApp stub:", error);
        }
    },

    // Helper to generate a WhatsApp Link for manual sending (e.g., in UI)
    getWhatsappLink: (phoneNumber: string, text: string): string => {
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const encodedText = encodeURIComponent(text);
        return `https://wa.me/${cleanNumber}?text=${encodedText}`;
    }
};
