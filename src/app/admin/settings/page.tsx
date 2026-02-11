"use client";

import { useEffect, useState } from "react";
import { SettingsService } from "@/services/settings.service";
import { AppSettings } from "@/types";
import { Save, Loader2, Truck, Percent, IndianRupee, AlertCircle, Phone, User } from "lucide-react";
import LogoLoader from "@/components/ui/LogoLoader";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/user.service";

export default function AdminSettingsPage() {
    const { dbUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");

    useEffect(() => {
        if (!authLoading && dbUser && dbUser.role !== 'admin') {
            router.push("/admin");
        }
    }, [dbUser, authLoading, router]);

    useEffect(() => {
        if (dbUser?.role === 'admin') {
            loadSettings();
            setPhoneNumber(dbUser.phoneNumber || "");
        }
    }, [dbUser]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await SettingsService.getSettings();
            setSettings(data);
        } catch (err) {
            setError("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Update app settings
            await SettingsService.updateSettings(settings, dbUser?.name || "Admin");

            // Update admin phone number if changed
            if (dbUser && phoneNumber !== dbUser.phoneNumber) {
                await UserService.updateUser(dbUser.id, { phoneNumber });
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LogoLoader />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-4 pb-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
                    <p className="text-gray-500">Manage delivery fees and application discounts</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
                    <Save className="h-5 w-5" />
                    <p>Settings saved successfully!</p>
                </div>
            )}


            <form onSubmit={handleSave} className="space-y-6">
                {/* Admin Profile */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Admin Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Name
                            </label>
                            <input
                                type="text"
                                value={dbUser?.name || ""}
                                disabled
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                            <p className="mt-1 text-xs text-gray-400">Your account name (read-only)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-purple-600" />
                                WhatsApp Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="977XXXXXXXXXX"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-400">For receiving order notifications (include country code)</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Settings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Delivery Configuration</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Base Delivery Fee (Rs)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rs.</span>
                                <input
                                    type="number"
                                    value={settings?.deliveryFee}
                                    onChange={(e) => setSettings(s => s ? { ...s, deliveryFee: Number(e.target.value) } : null)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    required
                                    min="0"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">Standard fee charged for deliveries</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Free Delivery Threshold (Rs)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rs.</span>
                                <input
                                    type="number"
                                    value={settings?.freeDeliveryThreshold}
                                    onChange={(e) => setSettings(s => s ? { ...s, freeDeliveryThreshold: Number(e.target.value) } : null)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    required
                                    min="0"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">Orders above this amount get free delivery</p>
                        </div>
                    </div>
                </div>

                {/* App Discount Settings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Percent className="h-5 w-5 text-green-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">App Discount (Online Orders)</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings?.enableAppDiscount ?? true}
                                    onChange={(e) => setSettings(s => s ? { ...s, enableAppDiscount: e.target.checked } : null)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className="text-sm font-medium text-gray-700">
                                {settings?.enableAppDiscount ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${settings?.enableAppDiscount ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Percentage (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={settings?.appDiscountPercentage}
                                    onChange={(e) => setSettings(s => s ? { ...s, appDiscountPercentage: Number(e.target.value) } : null)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    required
                                    min="0"
                                    max="100"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">Percentage discount for online app orders</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Discount Amount (Rs)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rs.</span>
                                <input
                                    type="number"
                                    value={settings?.minAppDiscount}
                                    onChange={(e) => setSettings(s => s ? { ...s, minAppDiscount: Number(e.target.value) } : null)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    required
                                    min="0"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">Minimum flat discount always applied</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valid From (Optional)
                            </label>
                            <input
                                type="date"
                                value={settings?.appDiscountStartDate || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, appDiscountStartDate: e.target.value } : null)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-400">Leave empty for always valid</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valid Until (Optional)
                            </label>
                            <input
                                type="date"
                                value={settings?.appDiscountEndDate || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, appDiscountEndDate: e.target.value } : null)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-400">Leave empty for always valid</p>
                        </div>
                    </div>
                </div>

                {/* First Order Discount Settings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">First Order Discount</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings?.enableFirstOrderDiscount ?? false}
                                    onChange={(e) => setSettings(s => s ? { ...s, enableFirstOrderDiscount: e.target.checked } : null)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <span className="text-sm font-medium text-gray-700">
                                {settings?.enableFirstOrderDiscount ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${settings?.enableFirstOrderDiscount ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Amount (Rs)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rs.</span>
                                <input
                                    type="number"
                                    value={settings?.firstOrderDiscountAmount ?? 0}
                                    onChange={(e) => setSettings(s => s ? { ...s, firstOrderDiscountAmount: Number(e.target.value) } : null)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                    min="0"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">Flat discount amount to apply</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Applies to First X Orders
                            </label>
                            <input
                                type="number"
                                value={settings?.firstOrderCountThreshold ?? 1}
                                onChange={(e) => setSettings(s => s ? { ...s, firstOrderCountThreshold: Number(e.target.value) } : null)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                min="1"
                            />
                            <p className="mt-1 text-xs text-gray-400">e.g., "1" means only the 1st order gets the discount</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valid From (Optional)
                            </label>
                            <input
                                type="date"
                                value={settings?.firstOrderDiscountStartDate || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, firstOrderDiscountStartDate: e.target.value } : null)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-400">Leave empty for always valid</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valid Until (Optional)
                            </label>
                            <input
                                type="date"
                                value={settings?.firstOrderDiscountEndDate || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, firstOrderDiscountEndDate: e.target.value } : null)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-400">Leave empty for always valid</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-900/10"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
