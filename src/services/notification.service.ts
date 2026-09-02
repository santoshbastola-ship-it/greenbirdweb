import { CollectionReference, collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, Timestamp, getDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notification, NotificationType, NotificationChannel } from "@/types";
import { sanitizeFirestoreData } from "@/lib/firestore-utils";
import { RESTRICTED_ROUTES_FOR_MANAGER } from "@/config/permissions";
import { PUSH_API } from "@/config/api";

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



            // If channel includes Push, try to send it
            if (notification.channels?.includes('push')) {
                await NotificationService.sendPushNotification(notification.targetUserId, notification.title, notification.message, notification.imageUrl, notification.relatedEntityId ? { id: notification.relatedEntityId, type: notification.relatedEntityType } : undefined);
            }

            return docRef.id;
        } catch (error) {
            console.error("Error creating notification:", error);
            // Don't throw, just log. Notifications shouldn't break the main flow.
            return "";
        }
    },

    // Get notifications for a specific user
    getUserNotifications: async (userId: string, limitCount: number = 50): Promise<Notification[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("targetUserId", "==", userId),
                orderBy("timestamp", "desc"),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const now = new Date();

            return querySnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                    } as Notification;
                })
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    return dateB - dateA; // Descending order
                })
                .filter(notification => {
                    // If validUntil exists, check if it has expired
                    if (notification.validUntil) {
                        const expiryDate = new Date(notification.validUntil);
                        return expiryDate > now;
                    }
                    return true;
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



    // Send Push Notification
    sendPushNotification: async (toUserId: string, title: string, body: string, imageUrl?: string, data?: any): Promise<void> => {
        try {
            await fetch(PUSH_API.SEND, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId, title, body, imageUrl, data })
            });
        } catch (error) {
            console.error("Error sending Push notification:", error);
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

    // Notify all admins and managers (In-App + WhatsApp)
    notifyAdmins: async (title: string, message: string, relatedEntityId?: string, relatedEntityType?: any, route?: string, triggeredBy?: string): Promise<void> => {
        try {
            console.log(`[NotificationService] notifyAdmins called. Title: ${title}, ID: ${relatedEntityId}`);

            if (triggeredBy) {
                message += ` (Updated by: ${triggeredBy})`;
            }

            // 1. Fetch all admins and managers
            // Firestore 'in' query supports up to 10 values
            const q = query(collection(db, "users"), where("role", "in", ["admin", "manager"]));
            const querySnapshot = await getDocs(q);
            const recipients = querySnapshot.docs;

            console.log(`[NotificationService] Found ${recipients.length} recipients (admins/managers).`);

            if (recipients.length === 0) {
                console.warn("[NotificationService] No admins or managers found to notify.");
                return;
            }

            // FILTER RECIPIENTS BASED ON ACCESS
            const filteredRecipients = recipients.filter(doc => {
                const userRole = doc.data().role;
                if (userRole === 'manager' && route) {
                    // Check if the notification route is restricted for managers
                    // We check if the route STARTS WITH any of the restricted paths
                    const isRestricted = RESTRICTED_ROUTES_FOR_MANAGER.some(restrictedPath =>
                        route === restrictedPath || route.startsWith(restrictedPath + '/')
                    );

                    if (isRestricted) {
                        console.log(`[NotificationService] Skipping notification for manager ${doc.id} due to restricted route: ${route}`);
                        return false;
                    }
                }
                return true;
            });

            if (filteredRecipients.length === 0) {
                console.log("[NotificationService] No valid recipients after access filtering.");
                return;
            }

            // 2. Send In-App Notifications
            const recipientIds = filteredRecipients.map(d => d.id);
            const inAppPromises = recipientIds.map(async (userId) => {
                try {
                    await NotificationService.createNotification({
                        targetUserId: userId,
                        title,
                        message,
                        type: 'info',
                        channels: ['in-app'],
                        relatedEntityId,
                        relatedEntityType,
                        route
                    });
                } catch (e) {
                    console.error(`[NotificationService] Failed to create in-app notification for user ${userId}:`, e);
                }
            });
            await Promise.all(inAppPromises);
            console.log(`[NotificationService] In-app notifications sent to ${recipientIds.length} users.`);




        } catch (error) {
            console.error("[NotificationService] Error notifying admins/managers:", error);
        }
    },

    // Broadcast a notification to all customers
    createBroadcastNotification: async (notification: Omit<Notification, "id" | "isRead" | "createdAt" | "targetUserId">, sentBy: string): Promise<void> => {
        try {
            // 1. Fetch all customers
            const q = query(collection(db, "users"), where("role", "==", "customer"));
            const customerSnap = await getDocs(q);
            const customerDocs = customerSnap.docs;

            if (customerDocs.length === 0) return;

            // 2. Create notifications for each customer in batches
            const batchSize = 500;
            for (let i = 0; i < customerDocs.length; i += batchSize) {
                const chunk = customerDocs.slice(i, i + batchSize);
                const batch = writeBatch(db);

                chunk.forEach(customerDoc => {
                    const docRef = doc(collection(db, COLLECTION_NAME));
                    const rawNotification = {
                        ...notification,
                        targetUserId: customerDoc.id,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        timestamp: Timestamp.now(),
                    };
                    const sanitized = sanitizeFirestoreData(rawNotification);
                    batch.set(docRef, sanitized);
                });

                await batch.commit();
            }

            // 3. Save to broadcast history
            await addDoc(collection(db, "broadcast_history"), sanitizeFirestoreData({
                title: notification.title,
                message: notification.message,
                sentAt: new Date().toISOString(),
                sentBy,
                recipientCount: customerDocs.length,
                type: notification.type,
                imageUrl: notification.imageUrl,
                validUntil: notification.validUntil,
                timestamp: Timestamp.now()
            }));

        } catch (error) {
            console.error("Error broadcasting notification:", error);
        }
    },

    // Get broadcast history
    getBroadcastHistory: async (limitCount: number = 20): Promise<any[]> => {
        try {
            const q = query(
                collection(db, "broadcast_history"),
                orderBy("timestamp", "desc"),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching broadcast history:", error);
            return [];
        }
    },

    // Delete broadcast history entry
    deleteBroadcastHistory: async (id: string): Promise<void> => {
        try {
            await import("firebase/firestore").then(async ({ deleteDoc }) => {
                await deleteDoc(doc(db, "broadcast_history", id));
            });
        } catch (error) {
            console.error("Error deleting broadcast history:", error);
        }
    }
};
