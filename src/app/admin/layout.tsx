import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-10">
                {children}
            </main>
        </div>
    );
}
