"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { signInWithGoogle } = useAuth();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");

        try {
            await signInWithGoogle();
            const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/shop";
            router.push(redirectTo);
        } catch (err: any) {
            console.error("Login error:", err);

            // Handle specific error cases
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in cancelled. Please try again.");
            } else if (err.code === 'auth/popup-blocked') {
                setError("Popup blocked. Please allow popups for this site.");
            } else if (err.code === 'auth/cancelled-popup-request') {
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
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {isLoading ? "Signing in..." : "Sign in with Google"}
                    </button>
                </div>


            </div>
        </div>
    );
}
