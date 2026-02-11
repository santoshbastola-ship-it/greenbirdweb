"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Lock, Check, Loader2, Save, Eye, EyeOff, Phone, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/user.service";
import { AuthService } from "@/services/auth.service";
import { cleanInput } from "@/lib/input-validation";

interface AdminProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminProfileModal({ isOpen, onClose }: AdminProfileModalProps) {
    const { user, dbUser, refreshDbUser } = useAuth();

    // Profile states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // UI states
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (dbUser) {
            setName(dbUser.name || "");
            setEmail(dbUser.email || "");
            setPhoneNumber(dbUser.phoneNumber || "");
            setAddress(dbUser.address || "");
        } else if (user) {
            setName(user.displayName || "");
            setEmail(user.email || "");
        }
    }, [dbUser, user, isOpen]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSavingProfile(true);
        setNotification(null);
        try {
            await UserService.updateUser(user.uid, {
                name,
                phoneNumber,
                address
            });
            await AuthService.updateUserProfile({ displayName: name });
            await refreshDbUser();
            setNotification({ type: 'success', message: 'Profile updated successfully' });
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to update profile' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setNotification({ type: 'error', message: 'Passwords do not match' });
            return;
        }

        setIsChangingPassword(true);
        setNotification(null);
        try {
            // Firebase re-authentication might be needed here usually, but let's try direct update first
            await AuthService.updateUserPassword(newPassword);
            setNotification({ type: 'success', message: 'Password changed successfully' });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to change password. You may need to log out and log back in to perform this action.' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'security' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Security
                    </button>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`mx-6 mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {notification.type === 'success' ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-red-700 flex items-center justify-center text-[10px] font-bold">!</div>}
                        {notification.message}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'profile' ? (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(cleanInput(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(cleanInput(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(cleanInput(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all min-h-[80px]"
                                        placeholder="Enter your address"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        disabled
                                        className="w-full pl-10 pr-4 py-2 border bg-gray-50 text-gray-500 rounded-xl cursor-not-allowed"
                                        placeholder="Email address"
                                    />
                                </div>
                                <p className="mt-1 text-[10px] text-gray-400">Email cannot be changed.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSavingProfile ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>Save Profile</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                        placeholder="Minimum 6 characters"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                        placeholder="Re-type new password"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50/50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
