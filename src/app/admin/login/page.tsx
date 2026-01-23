"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [needsVerification, setNeedsVerification] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const router = useRouter();
    const { signInWithEmail, resendVerificationEmail } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setNeedsVerification(false);
        setVerificationSent(false);

        try {
            await signInWithEmail(email, password);
            router.push("/admin");
        } catch (err: any) {
            console.error("Login error:", err);

            // Handle specific error cases
            if (err.message === "EMAIL_NOT_VERIFIED") {
                setNeedsVerification(true);
                setError("Please verify your email before logging in. Check your inbox for the verification link.");
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError("Invalid email or password. Please try again.");
            } else if (err.code === 'auth/user-not-found') {
                setError("No account found with this email.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Too many failed login attempts. Please try again later.");
            } else if (err.message === "User not found in database") {
                setError("Account not found. Please contact an administrator.");
            } else if (err.message === "Customers must login with Google") {
                setError("Customer accounts must use Google Sign-In. Please use the customer login page.");
            } else {
                setError("Failed to sign in. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setIsLoading(true);
        setError("");

        try {
            await resendVerificationEmail();
            setVerificationSent(true);
        } catch (err: any) {
            console.error("Resend verification error:", err);
            setError("Failed to resend verification email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-white">
            <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <div className="mx-auto flex justify-center mb-6">
                        <img
                            src="/images/logo.png"
                            alt="Greenbird Logo"
                            className="h-32 w-auto object-contain brightness-110"
                        />
                    </div>
                    <h2 className="text-3xl font-extrabold">Admin Dashboard</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Secure access for administrators and managers
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    </div>
                )}

                {verificationSent && (
                    <div className="bg-green-900/50 border-l-4 border-green-500 p-4 mb-4">
                        <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                            <p className="text-sm text-green-200">
                                Verification email sent! Please check your inbox and click the verification link.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="admin@greenbird.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </div>

                    {needsVerification && !verificationSent && (
                        <div>
                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-xl text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Resend Verification Email
                            </button>
                        </div>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Authorized personnel only.
                    </p>
                </div>
            </div>
        </div>
    );
}
