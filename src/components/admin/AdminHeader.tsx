"use client";

import { useState, useEffect } from "react";
import { User, LogOut, ChevronDown, UserCircle, Key, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminProfileModal from "./ProfileModal";
import { NotificationService } from "@/services/notification.service";
import Link from "next/link";

export default function AdminHeader() {
    const { user, dbUser, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Subscribe to unread notifications
    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = NotificationService.subscribeToUnreadCount(user.uid, (count) => {
                setUnreadCount(count);
            });
            return () => unsubscribe();
        }
    }, [user?.uid]);

    return (
        <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
            <div className="flex-1 hidden md:flex items-center space-x-6">
                <a href="/" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Home</a>
                <a href="/shop" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Shop</a>
                <a href="/blog" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Blog</a>
                <a href="/contact" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">Contact</a>
                <Link href="/admin" className="text-sm font-bold text-[#2D5A27] bg-[#2D5A27]/10 px-4 py-1.5 rounded-xl border border-[#2D5A27]/20 transition-all hover:bg-[#2D5A27]/20">Dashboard</Link>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                {/* Notification Bell */}
                <a
                    href="/admin/notifications"
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                    title="Notifications"
                >
                    <Bell className="h-5 w-5 text-gray-600 group-hover:text-green-600 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </a>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden border border-green-200 shadow-sm">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || "Admin"} className="h-full w-full object-cover" />
                            ) : (
                                (user?.displayName || "A").charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-bold text-gray-900 leading-none">
                                {user?.displayName || dbUser?.name || "Admin"}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1 capitalize">
                                {dbUser?.role || "Manage Account"}
                            </p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-5 py-3 border-b border-gray-50 mb-1">
                                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Signed in as</p>
                                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{user?.email}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsProfileModalOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                >
                                    <UserCircle className="h-4 w-4" />
                                    My Profile
                                </button>

                                {dbUser?.role !== 'admin' && (
                                    <button
                                        onClick={() => {
                                            setIsProfileModalOpen(true);
                                            setIsMenuOpen(false);
                                            // We'll pass a 'security' tab prop if we want to open it directly, 
                                            // but for now the modal has tabs.
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                    >
                                        <Key className="h-4 w-4" />
                                        Change Password
                                    </button>
                                )}

                                <div className="border-t border-gray-50 mt-1 pt-1">
                                    <button
                                        onClick={() => logout()}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AdminProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </header>
    );
}
