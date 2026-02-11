"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationService } from "@/services/notification.service";
import { Notification as NotificationType } from "@/types";
import { Bell, Check, Trash2, X, CheckSquare, Square, Eye, EyeOff } from "lucide-react";
import { toNepali, formatDateTime } from "@/lib/date-helper";
import { formatTextWithLinks } from "@/lib/text-helper";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Toast, ToastType } from "@/components/ui/Toast";

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('unread');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [actionLoading, setActionLoading] = useState(false);
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
        if (!user) {
            router.push("/login");
            return;
        }
        loadNotifications();
    }, [user]);

    // Clear selection when filter changes
    useEffect(() => {
        setSelectedIds([]);
    }, [filter]);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await NotificationService.getUserNotifications(user.uid);
            setNotifications(data);
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await NotificationService.markAsRead(notificationId);
            loadNotifications();
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleMarkAsUnread = async (notificationId: string) => {
        try {
            await NotificationService.markAsUnread(notificationId);
            loadNotifications();
        } catch (error) {
            console.error("Error marking notification as unread:", error);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Notification",
            message: "Are you sure you want to delete this notification?",
            confirmText: "Yes, Delete",
            variant: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setActionLoading(true);
                try {
                    await NotificationService.deleteNotification(id);
                    loadNotifications();
                } catch (error) {
                    console.error("Error deleting notification:", error);
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleTestNotification = async () => {
        if (!user) return;
        try {
            await NotificationService.createNotification({
                targetUserId: user.uid,
                title: "Test Notification",
                message: "This is a test notification to verify the system.",
                type: "info",
                channels: ["in-app"],
                route: "/admin/notifications"
            });
            loadNotifications();
        } catch (error) {
            console.error("Error creating test notification:", error);
        }
    };

    // Bulk Actions
    const handleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkMarkRead = async () => {
        if (selectedIds.length === 0) return;
        try {
            await NotificationService.markBatchAsRead(selectedIds);
            loadNotifications();
            setSelectedIds([]);
        } catch (error) {
            console.error("Error bulk marking read:", error);
        }
    };

    const handleBulkMarkUnread = async () => {
        if (selectedIds.length === 0) return;
        try {
            await NotificationService.markBatchAsUnread(selectedIds);
            loadNotifications();
            setSelectedIds([]);
        } catch (error) {
            console.error("Error bulk marking unread:", error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: "Delete Multiple Notifications",
            message: `Are you sure you want to delete ${selectedIds.length} notifications?`,
            confirmText: `Delete ${selectedIds.length}`,
            variant: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setActionLoading(true);
                try {
                    await NotificationService.deleteBatch(selectedIds); // Assuming deleteBatch is the correct service method
                    setSelectedIds([]);
                    loadNotifications();
                } catch (error) {
                    console.error("Error deleting notifications:", error);
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    // Global Actions
    const handleMarkAllAsRead = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            await NotificationService.markAllAsRead(user.uid);
            loadNotifications();
            showToast("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            showToast("Failed to mark all as read", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Bell className="h-8 w-8 text-green-600" />
                        Notifications
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                        Mark All Read
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'unread'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Unread
                    </button>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <span className="text-sm text-gray-500 mr-2">{selectedIds.length} selected</span>
                        <button
                            onClick={handleBulkMarkRead}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip"
                            title="Mark selected as read"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleBulkMarkUnread}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Mark selected as unread"
                        >
                            <EyeOff className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete selected"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>


            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading notifications...</p>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-500">
                        {filter === 'unread' ? "You have no unread notifications." : "You'll see notifications here when you receive them."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Select All Header (Optional, maybe implied functionality is better, but adding explicit select all checkbox at top of list is good) */}
                    <div className="flex items-center px-4 py-2 text-sm text-gray-500">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 hover:text-gray-700"
                        >
                            {selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0 ? (
                                <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                                <Square className="h-5 w-5" />
                            )}
                            Select All
                        </button>
                    </div>

                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`group bg-white rounded-xl p-4 shadow-sm border transition-all ${notification.isRead
                                ? 'border-gray-100'
                                : 'border-green-200 bg-green-50 border-l-4 border-l-green-500'
                                } hover:shadow-md`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Checkbox */}
                                <div className="mt-1">
                                    <button
                                        onClick={() => handleToggleSelect(notification.id)}
                                        className="text-gray-400 hover:text-green-600 transition-colors"
                                    >
                                        {selectedIds.includes(notification.id) ? (
                                            <CheckSquare className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Square className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold text-gray-900 ${!notification.isRead ? 'text-green-800' : ''}`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.isRead && (
                                                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {formatDateTime(notification.createdAt, "DD MMM YYYY")}
                                        </p>
                                    </div>
                                    <div className={`text-sm ${!notification.isRead ? 'text-gray-900 font-medium' : 'text-gray-600'} mb-3`}>
                                        {formatTextWithLinks(notification.message)}
                                    </div>

                                </div>

                                {/* Individual Actions */}
                                <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    {!notification.isRead ? (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                            title="Mark as read"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleMarkAsUnread(notification.id)}
                                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Mark as unread"
                                        >
                                            <EyeOff className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
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
