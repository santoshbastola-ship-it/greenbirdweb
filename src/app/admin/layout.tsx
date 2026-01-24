"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, dbUser, loading } = useAuth();
    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (!loading && !isLoginPage) {
            if (!user) {
                router.push("/admin/login");
            } else if (dbUser && dbUser.role !== 'admin' && dbUser.role !== 'manager') {
                // If logged in but not an admin, redirect to home or show error
                router.push("/");
            }
        }
    }, [user, dbUser, loading, isLoginPage, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (isLoginPage) {
        return <>{children}</>;
    }

    // Don't render content if not authorized (standard protection)
    if (!user || (dbUser && dbUser.role !== 'admin' && dbUser.role !== 'manager')) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-10">
                {children}
            </main>
        </div>
    );
}
