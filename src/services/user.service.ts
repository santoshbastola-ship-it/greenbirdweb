import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, UserRole } from "@/types";

const COLLECTION_NAME = "users";

export const UserService = {
    getAllCustomers: async (): Promise<User[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), where("role", "==", "customer"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });
        } catch (error) {
            console.error("Error fetching customers:", error);
            return [];
        }
    },

    getAllVendors: async (): Promise<User[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("role", "==", "customer"),
                where("partnerType", "==", "vendor")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });
        } catch (error) {
            console.error("Error fetching vendors:", error);
            return [];
        }
    },

    getAllPartners: async (): Promise<User[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), where("role", "==", "customer"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });
        } catch (error) {
            console.error("Error fetching partners:", error);
            return [];
        }
    },

    getUserById: async (id: string): Promise<User | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
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
            const q = query(collection(db, COLLECTION_NAME), where("email", "==", email));
            const querySnapshot = await getDocs(q);

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

            const docRef = await addDoc(collection(db, COLLECTION_NAME), newCustomer);
            return docRef.id;
        } catch (error) {
            console.error("Error creating customer:", error);
            throw error;
        }
    },

    updatePartnerTotal: async (partnerId: string, newTotal: number): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, partnerId);
            await updateDoc(docRef, { totalTransactionAmount: newTotal });
        } catch (error) {
            console.error("Error updating partner total:", error);
            // Don't throw - this is a background update
        }
    },

    // User Management Methods
    getAllUsers: async (): Promise<User[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as User;
            });
        } catch (error) {
            console.error("Error fetching all users:", error);
            return [];
        }
    },

    inviteUser: async (email: string, name: string, role: UserRole): Promise<string> => {
        try {
            // Check if user already exists
            const q = query(collection(db, COLLECTION_NAME), where("email", "==", email));
            const existingUsers = await getDocs(q);

            if (!existingUsers.empty) {
                throw new Error("User with this email already exists");
            }

            const newUser = {
                email,
                name,
                role,
                isActive: true,
                createdAt: new Date(),
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), newUser);
            return docRef.id;
        } catch (error) {
            console.error("Error inviting user:", error);
            throw error;
        }
    },

    updateUser: async (userId: string, data: Partial<User>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    toggleUserStatus: async (userId: string, isActive: boolean): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            await updateDoc(docRef, { isActive });
        } catch (error) {
            console.error("Error toggling user status:", error);
            throw error;
        }
    },

    ensureUserExists: async (userId: string, userData: Partial<User>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    ...userData,
                    role: userData.role || 'customer',
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
