"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationService } from "@/services/notification.service";
import { Notification as NotificationType } from "@/types";
import { Bell, Check, Trash2, Tag, ShoppingBag, CreditCard, Clock, Image as ImageIcon, ExternalLink, ChevronRight, X, CheckCircle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Toast, ToastType } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/date-helper";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotificationsPage() {
    const { user, requestNotificationPermission, loading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = "success") => {
        setToast({ message, type });
    };

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        variant: "danger" | "warning" | "info" | "success";
    }>({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "",
        onConfirm: () => { },
        variant: "danger"
    });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login?redirect=/notifications");
            return;
        }
        loadNotifications();
    }, [user, authLoading]);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await NotificationService.getUserNotifications(user.uid, 50);
            setNotifications(data);
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await NotificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await NotificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const getIcon = (type: string, entityType?: string) => {
        if (entityType === 'offer') return <Tag className="h-5 w-5 text-red-500" />;
        if (entityType === 'transaction') return <ShoppingBag className="h-5 w-5 text-green-500" />;
        return <Bell className="h-5 w-5 text-blue-500" />;
    };

    const formatNotificationDate = (date: any) => {
        try {
            return formatDateTime(date, "DD MMM YYYY");
        } catch (e) {
            return "Just now";
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            await NotificationService.markAllAsRead(user.uid);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            showToast("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            showToast("Failed to mark all as read", "error");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
            </div>
        );
    }



    // Filter notifications based on the selected filter
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Stay updated with your orders and latest offers
                        </p>
                        <button
                            onClick={() => requestNotificationPermission()}
                            className="w-fit text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline"
                        >
                            Enable Push Notifications
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter Tabs */}
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${filter === 'unread'
                                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Unread
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === 'unread'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                }`}>
                                {notifications.filter(n => !n.isRead).length}
                            </span>
                        </button>
                    </div>

                    {notifications.some(n => !n.isRead) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-green-200 dark:hover:border-green-800 hover:text-green-600 dark:hover:text-green-400 transition-all shadow-sm"
                        >
                            <Check className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Mark all read</span>
                        </button>
                    )}
                </div>
            </div>

            {filteredNotifications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-[32px] p-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="h-10 w-10 text-gray-300 dark:text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {filter === 'unread' ? 'No Unread Notifications' : 'All Caught Up!'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8 font-medium">
                        {filter === 'unread'
                            ? "You've read all your important updates."
                            : "You don't have any notifications right now."}
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#2D5A27] text-white rounded-2xl font-bold hover:bg-[#1a3a16] transition-all shadow-lg shadow-green-900/10"
                    >
                        Start Shopping
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`group relative bg-white dark:bg-gray-800 rounded-[24px] overflow-hidden border-2 transition-all p-1 ${notification.isRead
                                ? 'border-gray-50 dark:border-gray-700'
                                : 'border-green-100 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10'
                                } hover:border-green-200 dark:hover:border-green-800 hover:shadow-xl hover:shadow-green-900/5`}
                        >
                            <div className="flex flex-col sm:flex-row gap-4 p-5">
                                {/* Side Icon / Image */}
                                <div className="flex-shrink-0">
                                    {notification.imageUrl ? (
                                        <div className="w-full sm:w-24 h-48 sm:h-24 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <img
                                                src={notification.imageUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${notification.isRead ? 'bg-gray-50 dark:bg-gray-700' : 'bg-green-100 dark:bg-green-900/30'} transition-colors`}>
                                            {getIcon(notification.type, notification.relatedEntityType)}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pr-10">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className={`text-lg font-bold ${!notification.isRead ? 'text-green-900 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.isRead && (
                                            <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm leading-relaxed mb-4 ${!notification.isRead ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {notification.message}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 dark:text-gray-500">
                                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-xl">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatNotificationDate(notification.createdAt)}
                                        </div>
                                        {notification.relatedEntityType === 'offer' && notification.validUntil && (
                                            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                                                Expires: {formatDateTime(notification.validUntil, "DD MMM")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-6 right-6 flex flex-col gap-2">
                                    <button
                                        onClick={(e) => handleDelete(notification.id, e)}
                                        className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-xl transition-all"
                                            title="Mark as read"
                                        >
                                            <Check className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
                isLoading={actionLoading}
            />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
