"use client";

import { useState, useEffect } from "react";
import { NotificationService } from "@/services/notification.service";
import { ProductService } from "@/services/product.service";
import { Bell, Send, Image as ImageIcon, Trash2, Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PushNotificationsPage() {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [validityDays, setValidityDays] = useState("7");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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
        if (!title || !message) return;

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
            });

            setStatus({ type: 'success', message: "Notification broadcasted successfully to all customers!" });
            setTitle("");
            setMessage("");
            setImageFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error("Error broadcast notification:", error);
            setStatus({ type: 'error', message: "Failed to broadcast notification. Please try again." });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                    <Bell className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
                    <p className="text-gray-500">Broadcast updates and offers to all customers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
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

                {/* Preview */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Customer View Preview</h2>
                    <div className="bg-[#F8F9FA] rounded-3xl p-6 border-2 border-dashed border-gray-200">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform transition-all">
                            {previewUrl && (
                                <div className="h-48 overflow-hidden relative">
                                    <img src={previewUrl} alt="Offer" className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 font-bold text-xs uppercase tracking-wider bg-red-600 text-white px-3 py-1 rounded-full shadow-lg">
                                        Limited Time
                                    </div>
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                        {title || "Notification Title Placeholder"}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded font-medium">
                                        JUST NOW
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                    {message || "This is where your notification message will appear for the customers. Be clear and engaging!"}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-[11px] font-bold text-green-600 uppercase tracking-wide">
                                        Greenbird Homestead
                                    </span>
                                    <button className="text-[11px] font-bold text-gray-400 hover:text-green-600 transition-colors uppercase tracking-wide">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-xs text-gray-400 italic">
                            This is how the notification will look on the customer's notification page.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
