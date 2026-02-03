"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/auth.service";
import { auth } from "@/lib/firebase";
import { AlertCircle, Chrome } from "lucide-react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const { signInWithGoogle, signInWithGoogleRedirect, refreshDbUser } = useAuth();

    useEffect(() => {
        // Check if the page was opened from a sign-in link
        const handleAuthRedirect = async () => {
            try {
                const result = await AuthService.handleRedirectResult();
                if (result) {
                    setIsLoading(true);
                    await refreshDbUser(result.user.uid);
                    router.push("/shop"); // Default after success
                }
            } catch (err) {
                console.error("Redirect handler error:", err);
            }
        };

        const handleEmailLinkSignIn = async () => {
            if (AuthService.isSignInWithEmailLink(auth, window.location.href)) {
                let emailFromStorage = window.localStorage.getItem('emailForSignIn');
                if (!emailFromStorage) {
                    emailFromStorage = window.prompt('Please provide your email for confirmation');
                }

                if (emailFromStorage) {
                    setIsLoading(true);
                    try {
                        const result = await AuthService.completeSignInWithLink(emailFromStorage, window.location.href);
                        // Refresh user data BEFORE redirecting to ensure correct role is loaded
                        await refreshDbUser(result.user.uid);

                        // Decision logic for redirect
                        const redirectTo = new URLSearchParams(window.location.search).get("redirect");
                        if (redirectTo) {
                            router.push(redirectTo);
                        } else {
                            // Fetch user to check role
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
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        };

        handleAuthRedirect();
        handleEmailLinkSignIn();
    }, [router, refreshDbUser]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");

        try {
            // Check if mobile/tablet to decide between popup and redirect
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                await signInWithGoogleRedirect();
                return; // Redirect flows don't continue here
            }

            await signInWithGoogle();
            const redirectTo = new URLSearchParams(window.location.search).get("redirect");

            if (redirectTo) {
                router.push(redirectTo);
            } else {
                // Fetch the actual user data to decide where to go
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
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in cancelled. Please try again.");
            } else {
                setError("Failed to sign in with Google. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };



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
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Chrome className="w-5 h-5 text-blue-500" />
                        {isLoading ? "Signing in..." : "Sign in with Google"}
                    </button>
                </div>
            </div>
        </div>
    );
}
