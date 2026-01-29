"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
    signInWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshDbUser: (uid?: string) => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    dbUser: null,
    loading: true,
    signInWithGoogle: async () => { },
    signInWithEmail: async () => { },
    logout: async () => { },
    refreshDbUser: async () => { },
    resendVerificationEmail: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
            await AuthService.signOut();
            setUser(null);
            setDbUser(null);
            router.push('/');
        } catch (error: any) {
            console.error("Logout error:", error);
            throw error;
        }
    };

    useEffect(() => {
        console.log("AuthContext: Initializing listener");
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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

    return (
        <AuthContext.Provider value={{
            user,
            dbUser,
            loading,
            signInWithGoogle,
            signInWithEmail,
            logout,
            refreshDbUser,
            resendVerificationEmail
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
