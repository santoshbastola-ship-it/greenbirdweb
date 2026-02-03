"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, MoreVertical } from "lucide-react";
import { User, UserRole } from "@/types";
import { UserService } from "@/services/user.service";
import { AuthService } from "@/services/auth.service";
import AddUserModal from "@/components/admin/AddUserModal";
import EditUserModal from "@/components/admin/EditUserModal";
import LogoLoader from "@/components/ui/LogoLoader";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function UserManagementPage() {
    const { dbUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        if (!authLoading && dbUser && dbUser.role !== 'admin') {
            router.push("/admin");
        }
    }, [dbUser, authLoading, router]);

    useEffect(() => {
        if (dbUser?.role === 'admin') {
            loadUsers();
        }
    }, [dbUser]);

    useEffect(() => {
        // Filter users based on search query
        if (searchQuery.trim() === "") {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter(user => {
                return (
                    user.name.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query) ||
                    user.phoneNumber?.toLowerCase().includes(query) ||
                    getRoleDisplayName(user.role).toLowerCase().includes(query)
                );
            });
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const allUsers = await UserService.getAllUsers();
            // Strictly filter out customers, only show admins and managers
            const adminUsers = allUsers.filter(user => user.role === 'admin' || user.role === 'manager');

            // Safety deduplication by id
            const uniqueAdminUsers = adminUsers.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

            setUsers(uniqueAdminUsers);
            setFilteredUsers(uniqueAdminUsers);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteUser = async (email: string, name: string, role: UserRole, phoneNumber?: string) => {
        try {
            // Only admin and manager can be created through this interface
            if (role !== 'admin' && role !== 'manager') {
                throw new Error('Invalid role. Only admin and manager users can be created here.');
            }

            // 1. Create user in Firestore (without UID yet)
            await UserService.inviteUser(email, name, role as 'admin' | 'manager', phoneNumber);

            // 2. Send sign-in link
            await AuthService.sendSignInLink(email);

            await loadUsers();
        } catch (error: any) {
            console.error("Error inviting user:", error);
            throw error;
        }
    };

    const handleUpdateUser = async (userId: string, name: string, role: UserRole, phoneNumber?: string) => {
        try {
            await UserService.updateUser(userId, { name, role, phoneNumber });
            await loadUsers();
            // Show success message
            alert("User updated successfully!");
        } catch (error: any) {
            throw error;
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (dbUser?.email !== "greenbirdhomestead@gmail.com") {
            alert("Only the Super Admin can delete users.");
            return;
        }
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await UserService.deleteUser(userId);
                await loadUsers();
                alert("User deleted successfully");
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    const handleResendInvite = async (email: string) => {
        if (!email) {
            alert("User has no email address");
            return;
        }
        try {
            await AuthService.sendSignInLink(email);
            alert("Invitation sent successfully!");
        } catch (error) {
            console.error("Error resending invite:", error);
            alert("Failed to send invitation");
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        const action = currentStatus ? "deactivate" : "activate";
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            try {
                await UserService.toggleUserStatus(userId, !currentStatus);
                await loadUsers();
            } catch (error) {
                alert(`Failed to ${action} user`);
            }
        }
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const getRoleDisplayName = (role: UserRole) => {
        switch (role) {
            case "admin": return "Administrator";
            case "manager": return "Farm Manager";
            case "customer": return "Customer";
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case "admin": return "bg-purple-100 text-purple-800";
            case "manager": return "bg-orange-100 text-orange-800";
            case "customer": return "bg-blue-100 text-blue-800";
        }
    };

    const getRoleIconBg = (role: UserRole) => {
        switch (role) {
            case "admin": return "bg-purple-100 text-purple-600";
            case "manager": return "bg-orange-100 text-orange-600";
            case "customer": return "bg-blue-100 text-blue-600";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center shadow-sm"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* User List */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-100">
                    <div className="flex justify-center">
                        <LogoLoader />
                    </div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500">
                        {searchQuery ? "No users found matching your search" : "No users found"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => handleEditClick(user)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-shadow gap-4 group cursor-pointer"
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* Avatar */}
                                <div className={`h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center text-lg font-bold border ${getRoleIconBg(user.role).replace('bg-', 'bg-opacity-10 border-').replace('text-', 'bg-')} ${getRoleIconBg(user.role)}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-green-600 transition-colors">
                                            {user.name}
                                        </h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${getRoleColor(user.role)}`}>
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{user.email || "No email"}</p>
                                    {user.phoneNumber && (
                                        <p className="text-sm text-gray-600 font-medium">📱 {user.phoneNumber}</p>
                                    )}

                                    <div className="mt-1">
                                        {!user.isActive && (
                                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 text-[10px] font-bold uppercase tracking-wider">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleInviteUser}
            />

            <EditUserModal
                isOpen={showEditModal}
                user={selectedUser}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                }}
                onSubmit={handleUpdateUser}
                onDelete={dbUser?.email === "greenbirdhomestead@gmail.com" ? handleDeleteUser : undefined}
                onResendInvite={handleResendInvite}
                onToggleStatus={handleToggleStatus}
            />
        </div>
    );
}
