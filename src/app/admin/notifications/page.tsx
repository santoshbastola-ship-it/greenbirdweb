"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationService } from "@/services/notification.service";
import { Notification as NotificationType } from "@/types";
import { Bell, Check, Trash2, X } from "lucide-react";
import { toNepali } from "@/lib/date-helper";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        loadNotifications();
    }, [user]);

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

    const handleDelete = async (notificationId: string) => {
        if (!confirm("Delete this notification?")) return;
        try {
            await NotificationService.deleteNotification(notificationId);
            loadNotifications();
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Bell className="h-8 w-8 text-green-600" />
                    Notifications
                </h1>
                <p className="text-gray-600 mt-2">
                    {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading notifications...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                    <p className="text-gray-500">You'll see notifications here when you receive them.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${notification.isRead
                                ? 'border-gray-100'
                                : 'border-green-200 bg-green-50/30'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                                        {!notification.isRead && (
                                            <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                    <p className="text-xs text-gray-400">
                                        {toNepali(notification.createdAt, "DD MMM YYYY, hh:mm A")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {notification.route && (
                                <a
                                    href={notification.route}
                                    className="mt-3 inline-block text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                                >
                                    View Details →
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
