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
        console.log("AdminLayout Check:", {
            loading,
            hasUser: !!user,
            hasDbUser: !!dbUser,
            userRole: dbUser?.role,
            pathname
        });

        if (loading) return;

        if (!user) {
            console.log("Redirecting to login (no user)");
            router.push("/login?redirect=" + pathname);
            return;
        }

        if (dbUser) {
            if (dbUser.role !== 'admin' && dbUser.role !== 'manager') {
                console.log("Redirecting to home (invalid role)", dbUser.role);
                router.push("/");
            }
        } else {
            // User exists but dbUser is null. This might be a delay or failed fetch.
            // For now, we won't redirect to home immediately to avoid the flash/race condition if it's just slow.
            // But if it persists, it might mean the user is not in the DB.
            console.log("User authenticated but no DB record found yet.");
        }
    }, [user, dbUser, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    // Don't render content if not authorized (standard protection)
    if (!user || (dbUser && dbUser.role !== 'admin' && dbUser.role !== 'manager')) {
        return null;
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
