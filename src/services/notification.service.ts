import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, Timestamp, getDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notification, NotificationType, NotificationChannel } from "@/types";
import { sanitizeFirestoreData } from "@/lib/firestore-utils";

const COLLECTION_NAME = "notifications";
const WHATSAPP_LOGS_COLLECTION = "whatsapp_logs";

export const NotificationService = {
    // Create a new notification
    createNotification: async (notification: Omit<Notification, "id" | "isRead" | "createdAt">): Promise<string> => {
        try {
            const rawNotification = {
                ...notification,
                isRead: false,
                createdAt: new Date().toISOString(), // Use string for serializability
                timestamp: Timestamp.now(), // Use Firestore Timestamp for efficient querying
            };

            const newNotification = sanitizeFirestoreData(rawNotification);

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

    markAsRead: async (id: string): Promise<void> => {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, id), {
                isRead: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    },

    // Mark notification as unread
    markAsUnread: async (id: string): Promise<void> => {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, id), {
                isRead: false
            });
        } catch (error) {
            console.error("Error marking notification as unread:", error);
        }
    },

    // Mark batch as read
    markBatchAsRead: async (ids: string[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const ref = doc(db, COLLECTION_NAME, id);
                batch.update(ref, { isRead: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking batch as read:", error);
        }
    },

    // Mark batch as unread
    markBatchAsUnread: async (ids: string[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const ref = doc(db, COLLECTION_NAME, id);
                batch.update(ref, { isRead: false });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking batch as unread:", error);
        }
    },

    // Delete batch
    deleteBatch: async (ids: string[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const ref = doc(db, COLLECTION_NAME, id);
                batch.delete(ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error deleting batch:", error);
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
            const batch = writeBatch(db);
            querySnapshot.docs.forEach(d => {
                batch.update(d.ref, { isRead: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    },

    // Mark all as unread for a user
    markAllAsUnread: async (userId: string): Promise<void> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("targetUserId", "==", userId),
                where("isRead", "==", true)
            );
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.docs.forEach(d => {
                batch.update(d.ref, { isRead: false });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as unread:", error);
        }
    },

    // STUB: Send WhatsApp Notification
    // Send WhatsApp Notification (Zero-Cost Optimization)
    sendWhatsappNotification: async (toUserId: string, title: string, body: string): Promise<void> => {
        try {
            // Call API route to handle secure server-side sending
            // This prevents "process.env" issues on the client-side
            await fetch('/api/whatsapp/notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId, title, body })
            });

        } catch (error) {
            console.error("Error sending WhatsApp notification:", error);
        }
    },

    // Delete notification
    deleteNotification: async (id: string): Promise<void> => {
        try {
            await import("firebase/firestore").then(async ({ deleteDoc }) => {
                await deleteDoc(doc(db, COLLECTION_NAME, id));
            });
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    },

    // Helper to generate a WhatsApp Link for manual sending (e.g., in UI)
    getWhatsappLink: (phoneNumber: string, text: string): string => {
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const encodedText = encodeURIComponent(text);
        return `https://wa.me/${cleanNumber}?text=${encodedText}`;
    },

    // Subscribe to unread count
    subscribeToUnreadCount: (userId: string, callback: (count: number) => void): () => void => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("targetUserId", "==", userId),
                where("isRead", "==", false)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                callback(snapshot.size);
            }, (error) => {
                console.error("Error subscribing to unread count (snapshot error):", error);

                // If the error code includes 'failed-precondition', it's likely a missing index.
                if (error.code === 'failed-precondition') {
                    console.error("Missing Firestore Index! Please check the console link to create it.");
                }
            });

            return unsubscribe;
        } catch (error) {
            console.error("Error setting up unread count subscription:", error);
            return () => { };
        }
    },

    // Notify all admins (In-App + WhatsApp)
    notifyAdmins: async (title: string, message: string, relatedEntityId?: string, relatedEntityType?: any, route?: string): Promise<void> => {
        try {
            // 1. Fetch all admins
            const q = query(collection(db, "users"), where("role", "==", "admin"));
            const adminSnap = await getDocs(q);
            const adminDocs = adminSnap.docs;

            if (adminDocs.length === 0) return;

            // 2. Send In-App Notifications to ALL admins
            const adminIds = adminDocs.map(d => d.id);
            await Promise.all(adminIds.map(adminId =>
                NotificationService.createNotification({
                    targetUserId: adminId,
                    title,
                    message,
                    type: 'info',
                    channels: ['in-app'],
                    relatedEntityId,
                    relatedEntityType,
                    route
                })
            ));

            // 3. Send WhatsApp to UNIQUE phone numbers
            const uniquePhoneAdmins = new Map<string, string>();
            adminDocs.forEach(doc => {
                const data = doc.data();
                const phone = data.phoneNumber;
                if (phone && !uniquePhoneAdmins.has(phone)) {
                    uniquePhoneAdmins.set(phone, doc.id);
                }
            });

            await Promise.all(Array.from(uniquePhoneAdmins.values()).map(adminId =>
                NotificationService.createNotification({
                    targetUserId: adminId,
                    title,
                    message,
                    type: 'info',
                    channels: ['whatsapp'],
                    relatedEntityId,
                    relatedEntityType,
                    route
                })
            ));

        } catch (error) {
            console.error("Error notifying admins:", error);
        }
    }
};
