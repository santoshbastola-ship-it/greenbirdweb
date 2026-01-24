import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
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
            const email = result.user.email || '';

            // Ensure user exists in database. ensureUserExists will handle the role lookup by email.
            await UserService.ensureUserExists(result.user.uid, {
                name: result.user.displayName || 'Customer',
                email: email,
            });

            return result;
        } catch (error: any) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    },

    /**
     * Send passwordless sign-in link to email
     */
    sendSignInLink: async (email: string): Promise<void> => {
        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };
        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
        } catch (error: any) {
            console.error("Error sending sign-in link:", error);
            throw error;
        }
    },

    /**
     * Check if the sign-in link is valid
     */
    isSignInWithEmailLink: (authInstance: any, link: string): boolean => {
        return isSignInWithEmailLink(authInstance, link);
    },

    /**
     * Complete passwordless sign-in
     */
    completeSignInWithLink: async (email: string, link: string): Promise<UserCredential> => {
        try {
            const result = await signInWithEmailLink(auth, email, link);
            window.localStorage.removeItem('emailForSignIn');

            // Ensure user exists in database
            await UserService.ensureUserExists(result.user.uid, {
                email: email,
                name: result.user.displayName || 'User'
            });

            return result;
        } catch (error: any) {
            console.error("Error completing sign-in with link:", error);
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
     * Update current user's password
     */
    updateUserPassword: async (newPassword: string): Promise<void> => {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");
        try {
            const { updatePassword } = await import("firebase/auth");
            await updatePassword(user, newPassword);
        } catch (error: any) {
            console.error("Error updating password:", error);
            throw error;
        }
    },

    /**
     * Update current user's profile info
     */
    updateUserProfile: async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");
        try {
            const { updateProfile } = await import("firebase/auth");
            await updateProfile(user, data);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            throw error;
        }
    },

    /**
     * Send password reset email
     */
    sendPasswordResetEmail: async (email: string): Promise<void> => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            console.error("Error sending password reset email:", error);
            throw error;
        }
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
