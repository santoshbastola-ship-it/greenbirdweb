"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotificationService } from "@/services/notification.service";
import { ProductService } from "@/services/product.service";
import { Bell, Send, Image as ImageIcon, Trash2, Calendar, Loader2, CheckCircle2, AlertCircle, History, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/date-helper";
import { BroadcastHistory } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function PushNotificationsPage() {
    const { user, dbUser } = useAuth();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [validityDays, setValidityDays] = useState("7");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [history, setHistory] = useState<BroadcastHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

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

    const router = useRouter();

    useEffect(() => {
        if (dbUser?.role === "manager") {
            router.push("/admin");
            return;
        }
        loadHistory();
    }, [dbUser, router]);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await NotificationService.getBroadcastHistory();
            setHistory(data);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message || !user) return;

        setIsSending(true);
        setStatus(null);

        try {
            let imageUrl = "";
            if (imageFile) {
                imageUrl = await ProductService.uploadProductImage(imageFile);
            }

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(validityDays));

            await NotificationService.createBroadcastNotification({
                title,
                message,
                type: 'info',
                relatedEntityType: 'offer',
                validUntil: expiryDate.toISOString(),
                imageUrl: imageUrl || undefined,
            }, user.uid);

            setStatus({ type: 'success', message: "Notification broadcasted successfully to all customers!" });
            setTitle("");
            setMessage("");
            setImageFile(null);
            setPreviewUrl(null);
            loadHistory();
        } catch (error) {
            console.error("Error broadcast notification:", error);
            setStatus({ type: 'error', message: "Failed to broadcast notification. Please try again." });
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteHistory = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete History Entry",
            message: "Remove this entry from history? (This will not delete notifications already sent to customers)",
            confirmText: "Remove from History",
            variant: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await NotificationService.deleteBroadcastHistory(id);
                    setHistory(prev => prev.filter(h => h.id !== id));
                } catch (error) {
                    console.error("Error deleting history:", error);
                }
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                    <Bell className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
                    <p className="text-gray-500">Broadcast updates and offers to all customers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-xl shadow-green-900/5 border border-gray-100 p-8">
                        <form onSubmit={handleSend} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                    placeholder="Special Weekend Offer! 🌿"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message Body</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none min-h-[120px]"
                                    placeholder="Get 20% off on all organic vegetables this Saturday and Sunday. Order now!"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Validity Period</label>
                                    <div className="relative">
                                        <select
                                            value={validityDays}
                                            onChange={(e) => setValidityDays(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none outline-none"
                                        >
                                            <option value="1">1 Day</option>
                                            <option value="3">3 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="14">14 Days</option>
                                            <option value="30">30 Days</option>
                                        </select>
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Image (Optional)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="offer-image"
                                        />
                                        <label
                                            htmlFor="offer-image"
                                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <ImageIcon className="h-5 w-5 text-gray-400" />
                                            <span className="text-gray-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                                {imageFile ? imageFile.name : "Upload Image"}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {status && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                    <p className="text-sm font-medium">{status.message}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSending || !title || !message}
                                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${isSending || !title || !message
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 shadow-green-600/20 hover:-translate-y-0.5'
                                    }`}
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Broadcasting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Send Notification
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Preview */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Preview</h2>
                    <div className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-200">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {previewUrl && (
                                <div className="h-40 overflow-hidden relative">
                                    <img src={previewUrl} alt="Offer" className="w-full h-full object-cover" />
                                    <div className="absolute top-3 left-3 font-bold text-[10px] uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full shadow-lg">
                                        Limited Time
                                    </div>
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight">
                                        {title || "Notification Title"}
                                    </h3>
                                    <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-medium">
                                        JUST NOW
                                    </span>
                                </div>
                                <p className="text-gray-600 text-xs leading-relaxed mb-3">
                                    {message || "Your notification message will appear here."}
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">
                                        Greenbird Homestead
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-3xl shadow-xl shadow-green-900/5 border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                            <History className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Broadcast History</h2>
                    </div>
                    <button
                        onClick={loadHistory}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        Refresh
                    </button>
                </div>

                {loadingHistory ? (
                    <div className="flex flex-col items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500">Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No past broadcasts found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-100">
                                    <th className="pb-4 font-semibold text-gray-600 text-sm">Date & Time</th>
                                    <th className="pb-4 font-semibold text-gray-600 text-sm">Content</th>
                                    <th className="pb-4 font-semibold text-gray-600 text-sm text-center">Recipients</th>
                                    <th className="pb-4 font-semibold text-gray-600 text-sm text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map((item) => (
                                    <tr key={item.id} className="group">
                                        <td className="py-4 align-top">
                                            <p className="text-sm font-medium text-gray-900">{formatDateTime(item.sentAt, "DD MMM YYYY")}</p>
                                            <p className="text-xs text-gray-500">{formatDateTime(item.sentAt, "HH:mm A")}</p>
                                        </td>
                                        <td className="py-4 align-top max-w-md">
                                            <div className="flex gap-3">
                                                {item.imageUrl && (
                                                    <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</p>
                                                    <p className="text-xs text-gray-600 line-clamp-2">{item.message}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 align-top text-center">
                                            <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                                                <User className="h-3 w-3 mr-1" />
                                                {item.recipientCount}
                                            </span>
                                        </td>
                                        <td className="py-4 align-top text-right">
                                            <button
                                                onClick={() => handleDeleteHistory(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
            />
        </div>
    );
}
