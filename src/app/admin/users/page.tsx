"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, Search, MoreVertical } from "lucide-react";
import Link from "next/link";
import { User, UserRole } from "@/types";
import { UserService } from "@/services/user.service";
import { AuthService } from "@/services/auth.service";
import AddUserModal from "@/components/admin/AddUserModal";
import EditUserModal from "@/components/admin/EditUserModal";
import LogoLoader from "@/components/ui/LogoLoader";

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

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

    const handleInviteUser = async (email: string, name: string, role: UserRole) => {
        try {
            // Only admin and manager can be created through this interface
            if (role !== 'admin' && role !== 'manager') {
                throw new Error('Invalid role. Only admin and manager users can be created here.');
            }

            // 1. Create user in Firestore (without UID yet)
            await UserService.inviteUser(email, name, role as 'admin' | 'manager');

            // 2. Send sign-in link
            await AuthService.sendSignInLink(email);

            await loadUsers();
        } catch (error: any) {
            console.error("Error inviting user:", error);
            throw error;
        }
    };

    const handleUpdateUser = async (userId: string, name: string, role: UserRole) => {
        try {
            await UserService.updateUser(userId, { name, role });
            await loadUsers();
            // Show success message
            alert("User updated successfully!");
        } catch (error: any) {
            throw error;
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await UserService.deleteUser(userId);
                await loadUsers();
                alert("User deleted successfully");
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Failed to delete user");
            }
        }
        setActiveMenu(null);
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
        setActiveMenu(null);
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
        setActiveMenu(null);
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setShowEditModal(true);
        setActiveMenu(null);
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
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* User List */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <LogoLoader />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            {searchQuery ? "No users found matching your search" : "No users found"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleIconBg(user.role)}`}>
                                            <span className="text-lg font-semibold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                                {!user.isActive && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{user.email || "No email"}</p>
                                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${getRoleColor(user.role)}`}>
                                                {getRoleDisplayName(user.role)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="h-5 w-5 text-gray-600" />
                                        </button>

                                        {activeMenu === user.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setActiveMenu(null)}
                                                />
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                    >
                                                        Edit Role
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${user.isActive
                                                            ? "text-red-600 hover:bg-red-50"
                                                            : "text-green-600 hover:bg-green-50"
                                                            }`}
                                                    >
                                                        {user.isActive ? "Deactivate" : "Activate"}
                                                    </button>
                                                    {user.email && (
                                                        <button
                                                            onClick={() => handleResendInvite(user.email!)}
                                                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                                        >
                                                            Resend Invitation
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                                    >
                                                        Delete User
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-8 right-8 bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2 group"
            >
                <UserPlus className="h-6 w-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                    Add User
                </span>
            </button>

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
            />
        </div>
    );
}
