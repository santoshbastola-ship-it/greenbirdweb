"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";


export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, dbUser, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/login?redirect=" + pathname);
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    // Access Denied View
    if (dbUser && dbUser.role !== 'admin' && dbUser.role !== 'manager') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-8">
                        You do not have permission to access the admin dashboard.
                        Current role: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{dbUser.role || 'user'}</span>
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default protection while dbUser is loading or if it's null (rare case if user exists)
    // We render a simple loading state or just nothing to avoid flashing content
    if (!dbUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminHeader />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
