"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { UserService } from "@/services/user.service";
import { AuthService } from "@/services/auth.service";
import { User as AppUser } from "@/types";

interface AuthContextType {
    user: User | null;
    dbUser: AppUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGoogleRedirect: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshDbUser: (uid?: string) => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
    requestNotificationPermission: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    dbUser: null,
    loading: true,
    signInWithGoogle: async () => { },
    signInWithGoogleRedirect: async () => { },
    signInWithEmail: async () => { },
    logout: async () => { },
    refreshDbUser: async () => { },
    resendVerificationEmail: async () => { },
    requestNotificationPermission: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const isLoggingOutRef = useRef(false);

    const refreshDbUser = async (uid?: string) => {
        const targetUid = uid || user?.uid;
        if (targetUid) {
            const userData = await UserService.getUserById(targetUid);
            setDbUser(userData);
        } else {
            setDbUser(null);
        }
    };

    const signInWithGoogle = async () => {
        try {
            const result = await AuthService.signInWithGoogle();
            // Manually refresh to get the ensured role immediately
            await refreshDbUser(result.user.uid);
        } catch (error: any) {
            console.error("Google sign-in error:", error);
            throw error;
        }
    };

    const signInWithGoogleRedirect = async () => {
        try {
            await AuthService.signInWithGoogleRedirect();
        } catch (error: any) {
            console.error("Google redirect sign-in error:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const result = await AuthService.signInWithEmailPassword(email, password);
            // Manually refresh to get the ensured role immediately
            await refreshDbUser(result.user.uid);
        } catch (error: any) {
            console.error("Email sign-in error:", error);
            throw error;
        }
    };

    const resendVerificationEmail = async () => {
        if (user) {
            if (!user.emailVerified) {
                try {
                    await AuthService.sendEmailVerification(user);
                } catch (error: any) {
                    console.error("Error resending verification email:", error);
                    throw error;
                }
            }
        } else {
            throw new Error("USER_NOT_FOUND");
        }
    };

    const logout = async () => {
        try {
            isLoggingOutRef.current = true;
            await AuthService.signOut();
            // We do NOT set user/dbUser to null here to prevent flashing/redirects
            // The window reload will handle the state reset
            window.location.href = '/';
        } catch (error: any) {
            console.error("Logout error:", error);
            isLoggingOutRef.current = false; // Reset if error
            throw error;
        }
    };

    useEffect(() => {
        console.log("AuthContext: Initializing listener");
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // If logging out, ignore state changes to prevent protected routes 
            // from kicking in before the window reload
            if (isLoggingOutRef.current) return;

            console.log("AuthContext: Auth State Changed", firebaseUser?.uid);
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userData = await UserService.getUserById(firebaseUser.uid);
                    console.log("AuthContext: User Data Fetched", userData?.role);
                    setDbUser(userData);
                } catch (error) {
                    console.error("AuthContext: Error fetching user data", error);
                    setDbUser(null);
                }
            } else {
                console.log("AuthContext: No User");
                setUser(null);
                setDbUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const requestNotificationPermission = async () => {
        try {
            if (typeof window === "undefined") return;

            const { messaging } = await import("@/lib/firebase");
            const { getToken } = await import("firebase/messaging");
            const { doc, updateDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");

            if (!messaging) {
                console.log("Messaging not supported");
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (token && user) {
                    console.log("FCM Token:", token);
                    await updateDoc(doc(db, "users", user.uid), {
                        fcmToken: token
                    });
                }
            }
        } catch (error) {
            console.error("Error requesting notification permission:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            dbUser,
            loading,
            signInWithGoogle,
            signInWithGoogleRedirect,
            signInWithEmail,
            logout,
            refreshDbUser,
            resendVerificationEmail,
            requestNotificationPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
