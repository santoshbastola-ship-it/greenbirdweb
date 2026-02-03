"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationService } from "@/services/notification.service";
import { Notification as NotificationType } from "@/types";
import { Bell, Check, Trash2, Tag, ShoppingBag, CreditCard, Clock, Image as ImageIcon, ExternalLink, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/date-helper";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push("/login?redirect=/notifications");
            return;
        }
        loadNotifications();
    }, [user]);

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
            return formatDateTime(date, "DD MMM YYYY, hh:mm A");
        } catch (e) {
            return "Just now";
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-2xl">
                            <Bell className="h-8 w-8 text-green-600" />
                        </div>
                        Notifications
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Stay updated with your orders and latest offers
                    </p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={async () => {
                            if (user) {
                                await NotificationService.markAllAsRead(user.uid);
                                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:border-green-200 hover:text-green-600 transition-all shadow-sm"
                    >
                        <Check className="h-4 w-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-[32px] p-16 text-center border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">
                        You don't have any notifications right now. We'll alert you when something happens.
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
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`group relative bg-white rounded-[24px] overflow-hidden border-2 transition-all p-1 ${notification.isRead
                                ? 'border-gray-50'
                                : 'border-green-100 bg-green-50/30'
                                } hover:border-green-200 hover:shadow-xl hover:shadow-green-900/5`}
                        >
                            <div className="flex flex-col sm:flex-row gap-4 p-5">
                                {/* Side Icon / Image */}
                                <div className="flex-shrink-0">
                                    {notification.imageUrl ? (
                                        <div className="w-full sm:w-24 h-48 sm:h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                            <img
                                                src={notification.imageUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${notification.isRead ? 'bg-gray-50' : 'bg-green-100'} transition-colors`}>
                                            {getIcon(notification.type, notification.relatedEntityType)}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pr-10">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className={`text-lg font-bold text-gray-900 ${!notification.isRead ? 'text-green-900' : ''}`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.isRead && (
                                            <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm leading-relaxed mb-4 ${!notification.isRead ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                                        {notification.message}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatNotificationDate(notification.createdAt)}
                                        </div>
                                        {notification.relatedEntityType === 'offer' && notification.validUntil && (
                                            <div className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                                                Expires: {formatDateTime(notification.validUntil, "DD MMM")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-6 right-6 flex flex-col gap-2">
                                    <button
                                        onClick={(e) => handleDelete(notification.id, e)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            className="p-2 text-green-500 hover:bg-green-100 rounded-xl transition-all"
                                            title="Mark as read"
                                        >
                                            <Check className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Optional Route Link */}
                            {notification.route && (
                                <Link
                                    href={notification.route}
                                    className="block border-t border-gray-50 p-4 bg-gray-50/50 hover:bg-green-50 transition-colors text-center text-xs font-bold text-green-600 uppercase tracking-widest flex items-center justify-center gap-2 group/link"
                                >
                                    View Details
                                    <ExternalLink className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
