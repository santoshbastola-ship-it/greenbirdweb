"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/auth.service";
import { auth } from "@/lib/firebase";
import { AlertCircle, Chrome } from "lucide-react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(true); // Default to true to wait for auth check
    const [isProcessingLogin, setIsProcessingLogin] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const { user, dbUser, signInWithGoogle, signInWithGoogleRedirect, refreshDbUser, loading: authLoading } = useAuth();

    // 1. Initial Auth Check & Redirect Handling
    useEffect(() => {
        const checkAuthAndHandleRedirect = async () => {
            // Wait for AuthProvider to finish initial loading
            if (authLoading) return;

            try {
                // Check if user is already logged in
                if (user) {
                    console.log("LoginPage: User already logged in, redirecting...");
                    const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/shop";
                    router.replace(redirectTo);
                    return;
                }

                // Check for redirect result from Google sign-in
                console.log("LoginPage: Checking for redirect result...");
                const result = await AuthService.handleRedirectResult();

                if (result) {
                    setIsProcessingLogin(true);
                    console.log("LoginPage: Successful redirect sign-in", result.user.uid);
                    await refreshDbUser(result.user.uid);

                    const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/shop";
                    router.push(redirectTo);
                    return;
                }

                // Check for email link sign-in
                if (AuthService.isSignInWithEmailLink(auth, window.location.href)) {
                    await handleEmailLinkSignIn();
                }

            } catch (err: any) {
                console.error("LoginPage: Auth check/redirect error:", err);
                if (err.code !== 'auth/web-storage-unsupported' && err.code !== 'auth/operation-not-supported-in-this-environment') {
                    setError("An error occurred during sign-in. Please try again.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthAndHandleRedirect();
    }, [user, authLoading, router]);

    const handleEmailLinkSignIn = async () => {
        let emailFromStorage = window.localStorage.getItem('emailForSignIn');
        if (!emailFromStorage) {
            emailFromStorage = window.prompt('Please provide your email for confirmation');
        }

        if (emailFromStorage) {
            setIsProcessingLogin(true);
            try {
                const result = await AuthService.completeSignInWithLink(emailFromStorage, window.location.href);
                await refreshDbUser(result.user.uid);

                const redirectTo = new URLSearchParams(window.location.search).get("redirect");
                if (redirectTo) {
                    router.push(redirectTo);
                } else {
                    // Check role for default redirect
                    const { UserService } = await import("@/services/user.service");
                    const userDoc = await UserService.getUserById(result.user.uid);
                    if (userDoc && (userDoc.role === 'admin' || userDoc.role === 'manager')) {
                        router.push("/admin");
                    } else {
                        router.push("/shop");
                    }
                }
            } catch (err: any) {
                console.error("Link sign-in error:", err);
                setError("Failed to sign in with link. The link may have expired or already been used.");
                setIsProcessingLogin(false);
            }
        }
    };

    const handleGoogleLogin = async () => {
        setIsProcessingLogin(true);
        setError("");

        try {
            // Using popup for both mobile and desktop to avoid redirect issues
            // caused by third-party cookie restrictions on some mobile browsers
            console.log("LoginPage: Initiating Google sign-in...");
            await signInWithGoogle();

            // Post-login navigation
            const redirectTo = new URLSearchParams(window.location.search).get("redirect");
            if (redirectTo) {
                router.push(redirectTo);
            } else {
                const { UserService } = await import("@/services/user.service");
                const { auth } = await import("@/lib/firebase");
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const userDoc = await UserService.getUserById(currentUser.uid);
                    if (userDoc && (userDoc.role === 'admin' || userDoc.role === 'manager')) {
                        router.push("/admin");
                    } else {
                        router.push("/shop");
                    }
                } else {
                    router.push("/shop");
                }
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setIsProcessingLogin(false);
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in cancelled. Please try again.");
            } else if (err.code === 'auth/cancelled-by-user') {
                setError("Sign-in was cancelled.");
            } else if (err.code === 'auth/popup-blocked') {
                setError("Sign-in popup was blocked. Please allow popups for this site.");
            } else {
                setError("Failed to sign in with Google. Please try again.");
            }
        }
    };

    if (isLoading && !isProcessingLogin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto flex justify-center mb-6">
                        <img
                            src="/images/logo.png"
                            alt="Greenbird Logo"
                            className="h-32 w-auto object-contain"
                        />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Welcome</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to your Greenbird account
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isProcessingLogin}
                        className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Chrome className="w-5 h-5 text-blue-500" />
                        {isProcessingLogin ? "Signing in..." : "Sign in with Google"}
                    </button>
                </div>
            </div>
        </div>
    );
}
