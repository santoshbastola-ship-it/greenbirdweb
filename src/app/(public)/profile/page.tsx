"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/user.service";
import { Check, Loader2, MapPin, Plus, Trash2, User, Phone, Mail, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, dbUser, loading: authLoading, refreshDbUser } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [addresses, setAddresses] = useState<string[]>([]);
    const [newAddress, setNewAddress] = useState("");

    // Notification state
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Loading states
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Redirect if not logged in and not loading
        if (!authLoading && !user) {
            router.push("/login?redirect=/profile");
        }

        // Initialize form data from dbUser
        if (dbUser) {
            setName(dbUser.name || "");
            setPhoneNumber(dbUser.phoneNumber || "");
            setAddresses(dbUser.addresses || (dbUser.address ? [dbUser.address] : []));
        } else if (user) {
            setName(user.displayName || "");
        }
    }, [user, dbUser, authLoading, router]);

    const handleAddAddress = () => {
        if (!newAddress.trim()) return;
        setAddresses([...addresses, newAddress.trim()]);
        setNewAddress("");
    };

    const handleRemoveAddress = (index: number) => {
        setAddresses(addresses.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            await UserService.updateUser(user.uid, {
                name,
                phoneNumber,
                addresses
            });
            await refreshDbUser();
            setNotification({ type: 'success', message: 'Profile updated successfully' });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setNotification({ type: 'error', message: 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Notification */}
                {notification && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {notification.type === 'success' ? <Check className="h-5 w-5" /> : <div className="h-5 w-5 font-bold">!</div>}
                        <p>{notification.message}</p>
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage your personal information and delivery addresses.</p>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5 text-green-600" />
                            Personal Details
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Profile Image */}
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-gray-100 mb-6">
                            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-3xl overflow-hidden shadow-inner mb-3 border-4 border-white ring-4 ring-green-50">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" />
                                ) : (
                                    (user.displayName || "U").charAt(0).toUpperCase()
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{user.displayName || "User"}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                        placeholder="Your phone number"
                                    />
                                </div>
                            </div>

                            {/* Email (Read only) */}
                            <div className="md:col-span-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                    <span className="ml-2 text-xs text-gray-400 font-normal">(Cannot be changed)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={user.email || ""}
                                        readOnly
                                        disabled
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Addresses */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-600" />
                            Delivery Addresses
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Address List */}
                        <div className="space-y-3">
                            {addresses.map((address, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-green-200 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-green-600 transition-colors" />
                                        <span className="text-gray-700 text-sm leading-relaxed">{address}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveAddress(index)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove address"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {addresses.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No delivery addresses saved yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Add Address */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAddress()}
                                placeholder="Enter a new delivery address..."
                                className="flex-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                            />
                            <button
                                onClick={handleAddAddress}
                                disabled={!newAddress.trim()}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
