import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, UserRole } from "@/types";
import { NotificationService } from "./notification.service";

const USERS_COLLECTION = "users";
const PARTNERS_COLLECTION = "partners";

export const UserService = {
    getAllCustomers: async (): Promise<User[]> => {
        try {
            // Fetch from both collections for transition
            const q1 = query(collection(db, PARTNERS_COLLECTION), where("role", "==", "customer"));
            const q2 = query(collection(db, USERS_COLLECTION), where("role", "==", "customer"));

            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

            const results = [...snap1.docs, ...snap2.docs].map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });

            // De-duplicate if same ID exists in both (though shouldn't happen)
            return results.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        } catch (error) {
            console.error("Error fetching customers:", error);
            return [];
        }
    },

    getAllVendors: async (): Promise<User[]> => {
        try {
            const q1 = query(
                collection(db, PARTNERS_COLLECTION),
                where("role", "==", "customer"),
                where("partnerType", "==", "vendor")
            );
            const q2 = query(
                collection(db, USERS_COLLECTION),
                where("role", "==", "customer"),
                where("partnerType", "==", "vendor")
            );

            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

            const results = [...snap1.docs, ...snap2.docs].map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });

            return results.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        } catch (error) {
            console.error("Error fetching vendors:", error);
            return [];
        }
    },

    getAllPartners: async (): Promise<User[]> => {
        try {
            const q1 = query(collection(db, PARTNERS_COLLECTION), where("role", "==", "customer"));
            const q2 = query(collection(db, USERS_COLLECTION), where("role", "==", "customer"));

            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

            const results = [...snap1.docs, ...snap2.docs].map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });

            return results.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        } catch (error) {
            console.error("Error fetching partners:", error);
            return [];
        }
    },

    getUserById: async (id: string): Promise<User | null> => {
        try {
            // First check users collection (internal)
            let docRef = doc(db, USERS_COLLECTION, id);
            let docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Then check partners collection
                docRef = doc(db, PARTNERS_COLLECTION, id);
                docSnap = await getDoc(docRef);
            }

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user:", error);
            return null;
        }
    },

    getUserByEmail: async (email: string): Promise<User | null> => {
        try {
            // Check users first
            let q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Check partners
                q = query(collection(db, PARTNERS_COLLECTION), where("email", "==", email));
                querySnapshot = await getDocs(q);
            }

            if (querySnapshot.empty) {
                return null;
            }

            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            } as User;
        } catch (error) {
            console.error("Error fetching user by email:", error);
            return null;
        }
    },

    createCustomer: async (data: Omit<User, "id" | "createdAt" | "role" | "isActive"> & { partnerType?: "customer" | "vendor" }): Promise<string> => {
        try {
            // Generate a dummy email if not provided, to satisfy the User interface
            const email = data.email || `${data.partnerType || 'customer'}_${Date.now()}@manual.entry`;

            const newCustomer = {
                ...data,
                email,
                role: "customer" as UserRole,
                partnerType: data.partnerType || "customer",
                isActive: true,
                createdAt: new Date(),
                totalTransactionAmount: 0,
            };

            const docRef = await addDoc(collection(db, PARTNERS_COLLECTION), newCustomer);

            // Notify Admins
            await NotificationService.notifyAdmins(
                "New Partner Created",
                `New ${data.partnerType} created: ${data.name}`,
                docRef.id,
                'user',
                '/admin/partners'
            );

            return docRef.id;
        } catch (error) {
            console.error("Error creating customer:", error);
            throw error;
        }
    },

    updatePartnerTotal: async (partnerId: string, newTotal: number): Promise<void> => {
        try {
            // Try partners first
            const docRef = doc(db, PARTNERS_COLLECTION, partnerId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, { totalTransactionAmount: newTotal });
            } else {
                // If not in partners, maybe it's an old customer in users?
                const userRef = doc(db, USERS_COLLECTION, partnerId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    await updateDoc(userRef, { totalTransactionAmount: newTotal });
                }
            }
        } catch (error) {
            console.error("Error updating partner total:", error);
            // Don't throw - this is a background update
        }
    },

    // User Management Methods
    getAllUsers: async (): Promise<User[]> => {
        try {
            // Only internal users from USERS_COLLECTION
            const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });

            // Deduplicate by ID and Email
            const uniqueUsers: User[] = [];
            const seenIds = new Set<string>();
            const seenEmails = new Set<string>();

            for (const user of users) {
                const email = user.email?.toLowerCase();
                if (!seenIds.has(user.id) && (!email || !seenEmails.has(email))) {
                    uniqueUsers.push(user);
                    seenIds.add(user.id);
                    if (email) seenEmails.add(email);
                }
            }

            return uniqueUsers;
        } catch (error) {
            console.error("Error fetching all users:", error);
            return [];
        }
    },

    inviteUser: async (email: string, name: string, role: UserRole, phoneNumber?: string): Promise<string> => {
        try {
            // Check if user already exists in users collection
            const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
            const existingUsers = await getDocs(q);

            if (!existingUsers.empty) {
                throw new Error("User with this email already exists");
            }

            const newUser = {
                email,
                name,
                role,
                phoneNumber: phoneNumber || null,
                isActive: true,
                createdAt: new Date(),
            };

            const docRef = await addDoc(collection(db, USERS_COLLECTION), newUser);

            // Notify Admins
            await NotificationService.notifyAdmins(
                "New User Invited",
                `New user invited: ${email} as ${role}`,
                docRef.id,
                'user',
                '/admin/users'
            );

            return docRef.id;
        } catch (error) {
            console.error("Error inviting user:", error);
            throw error;
        }
    },

    deleteUser: async (userId: string): Promise<void> => {
        try {
            await import("firebase/firestore").then(async ({ deleteDoc }) => {
                const docRef = doc(db, USERS_COLLECTION, userId);
                await deleteDoc(docRef);

                // Notify Admins
                await NotificationService.notifyAdmins(
                    "User Deleted",
                    `User deleted: ${userId}`,
                    undefined,
                    'user',
                    '/admin/users'
                );
            });
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },

    updateUser: async (userId: string, data: Partial<User>): Promise<void> => {
        try {
            // Format phone number if provided
            if (data.phoneNumber) {
                // Remove any spaces, dashes, or special characters
                let phoneNumber = data.phoneNumber.replace(/[\s\-\(\)]/g, '');

                // If phone number doesn't start with 977 and is 10 digits, add 977 prefix
                if (!phoneNumber.startsWith('977') && phoneNumber.length === 10) {
                    phoneNumber = '977' + phoneNumber;
                    console.log(`[UserService] Added country code 977 to phone number: ${phoneNumber}`);
                }

                // Update the data object with formatted phone number
                data = { ...data, phoneNumber };
            }

            // Check users first
            let docRef = doc(db, USERS_COLLECTION, userId);
            let docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // If not in users, check partners (for profile updates of customers if needed)
                docRef = doc(db, PARTNERS_COLLECTION, userId);
                docSnap = await getDoc(docRef);
            }

            if (docSnap.exists()) {
                await setDoc(docRef, data, { merge: true });

                // Notify Admins
                await NotificationService.notifyAdmins(
                    "User Updated",
                    `User updated: ${data.name || userId}`,
                    userId,
                    'user',
                    '/admin/users'
                );
            } else {
                throw new Error("User not found");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    toggleUserStatus: async (userId: string, isActive: boolean): Promise<void> => {
        try {
            // Check users first
            let docRef = doc(db, USERS_COLLECTION, userId);
            let docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                docRef = doc(db, PARTNERS_COLLECTION, userId);
                docSnap = await getDoc(docRef);
            }

            if (docSnap.exists()) {
                await setDoc(docRef, { isActive }, { merge: true });

                // Notify Admins
                await NotificationService.notifyAdmins(
                    "User Status Changed",
                    `User ${userId} status changed to ${isActive ? 'Active' : 'Inactive'}`,
                    userId,
                    'user',
                    '/admin/users'
                );
            }
        } catch (error) {
            console.error("Error toggling user status:", error);
            throw error;
        }
    },

    ensureUserExists: async (userId: string, userData: Partial<User>): Promise<void> => {
        try {
            const adminEmails = ['greenbirdhomestead@gmail.com'];
            const isHardcodedAdmin = userData.email && adminEmails.includes(userData.email);

            // 1. Check if user already exists in USERS collection
            const userDocRef = doc(db, USERS_COLLECTION, userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const currentData = userDocSnap.data();
                if (isHardcodedAdmin && currentData.role !== 'admin') {
                    await setDoc(userDocRef, { role: 'admin' }, { merge: true });
                }
                return;
            }

            // 2. Check if user exists in PARTNERS collection
            const partnerDocRef = doc(db, PARTNERS_COLLECTION, userId);
            const partnerDocSnap = await getDoc(partnerDocRef);

            if (partnerDocSnap.exists()) {
                // If they became an admin (e.g. invited via email in USERS collection), we should move them from PARTNERS to USERS
                if (isHardcodedAdmin) {
                    const currentData = partnerDocSnap.data();
                    await setDoc(userDocRef, {
                        ...currentData,
                        ...userData,
                        role: 'admin',
                        isActive: true,
                        createdAt: currentData.createdAt || new Date()
                    });
                    // Ideally delete from partners, but let's keep it safe for now or delete later
                    return;
                }
                return;
            }

            // 3. User doesn't exist by UID in either collection. 
            // Check if there's an email-based document in EITHER collection.
            if (userData.email) {
                // Check USERS collection (e.g. invited admin)
                const qUser = query(collection(db, USERS_COLLECTION), where("email", "==", userData.email));
                const userSnapshot = await getDocs(qUser);

                if (!userSnapshot.empty) {
                    const existingDoc = userSnapshot.docs[0];
                    const existingData = existingDoc.data();
                    await setDoc(userDocRef, {
                        ...existingData,
                        ...userData,
                        role: isHardcodedAdmin ? 'admin' : (existingData.role || 'manager'), // If in USERS, they are at least manager
                        isActive: true,
                        createdAt: existingData.createdAt || new Date(),
                    });
                    return;
                }

                // Check PARTNERS collection
                const qPartner = query(collection(db, PARTNERS_COLLECTION), where("email", "==", userData.email));
                const partnerSnapshot = await getDocs(qPartner);

                if (!partnerSnapshot.empty) {
                    const existingDoc = partnerSnapshot.docs[0];
                    const existingData = existingDoc.data();

                    if (isHardcodedAdmin) {
                        // Move to USERS
                        await setDoc(userDocRef, {
                            ...existingData,
                            ...userData,
                            role: 'admin',
                            isActive: true,
                            createdAt: existingData.createdAt || new Date(),
                        });
                    } else {
                        // Keep in PARTNERS but with UID
                        await setDoc(partnerDocRef, {
                            ...existingData,
                            ...userData,
                            role: existingData.role || 'customer',
                            isActive: true,
                            createdAt: existingData.createdAt || new Date(),
                        });
                    }
                    return;
                }
            }

            // 4. No existing record found. Create NEW record.
            if (isHardcodedAdmin) {
                await setDoc(userDocRef, {
                    ...userData,
                    role: 'admin',
                    isActive: true,
                    createdAt: new Date(),
                    totalTransactionAmount: 0,
                });
            } else {
                // Default to partner/customer
                await setDoc(partnerDocRef, {
                    ...userData,
                    role: 'customer',
                    isActive: true,
                    createdAt: new Date(),
                    totalTransactionAmount: 0,
                });
            }
        } catch (error) {
            console.error("Error ensuring user exists:", error);
        }
    }
};
