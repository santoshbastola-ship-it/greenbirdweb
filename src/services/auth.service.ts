import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    User,
    UserCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserService } from "./user.service";
import { UserRole } from "@/types";

const googleProvider = new GoogleAuthProvider();

export const AuthService = {
    /**
     * Sign in with Google OAuth (for customers)
     */
    signInWithGoogle: async (): Promise<UserCredential> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Ensure customer exists in database
            await UserService.ensureUserExists(result.user.uid, {
                name: result.user.displayName || 'Customer',
                email: result.user.email || '',
                role: 'customer'
            });

            return result;
        } catch (error: any) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    },

    /**
     * Sign in with email and password (for admin/manager)
     */
    signInWithEmailPassword: async (email: string, password: string): Promise<UserCredential> => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);

            // Check if user exists in database and has admin/manager role
            const dbUser = await UserService.getUserByEmail(email);
            if (!dbUser) {
                throw new Error("User not found in database");
            }

            if (dbUser.role === 'customer') {
                throw new Error("Customers must login with Google");
            }

            // Check if email is verified
            if (!result.user.emailVerified) {
                throw new Error("EMAIL_NOT_VERIFIED");
            }

            return result;
        } catch (error: any) {
            console.error("Error signing in with email/password:", error);
            throw error;
        }
    },

    /**
     * Create a new user account with email/password (for admin/manager)
     */
    createUserAccount: async (
        email: string,
        password: string,
        name: string,
        role: 'admin' | 'manager'
    ): Promise<{ user: User; userId: string }> => {
        try {
            // Check if user already exists
            const existingUser = await UserService.getUserByEmail(email);
            if (existingUser) {
                throw new Error("User with this email already exists");
            }

            // Create Firebase auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Send verification email
            await sendEmailVerification(userCredential.user);

            // Create user in Firestore
            await UserService.ensureUserExists(userCredential.user.uid, {
                name,
                email,
                role,
                isActive: true
            });

            return {
                user: userCredential.user,
                userId: userCredential.user.uid
            };
        } catch (error: any) {
            console.error("Error creating user account:", error);
            throw error;
        }
    },

    /**
     * Send email verification to current user
     */
    sendEmailVerification: async (user: User): Promise<void> => {
        try {
            await sendEmailVerification(user);
        } catch (error: any) {
            console.error("Error sending verification email:", error);
            throw error;
        }
    },

    /**
     * Check if user's email is verified
     */
    checkEmailVerified: (user: User): boolean => {
        return user.emailVerified;
    },

    /**
     * Sign out current user
     */
    signOut: async (): Promise<void> => {
        try {
            await firebaseSignOut(auth);
        } catch (error: any) {
            console.error("Error signing out:", error);
            throw error;
        }
    }
};
