"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { User, UserRole } from "@/types";
import { cleanInput } from "@/lib/input-validation";

interface EditUserModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSubmit: (userId: string, name: string, role: UserRole, phoneNumber?: string) => Promise<void>;
    onDelete?: (userId: string) => Promise<void>;
    onResendInvite: (email: string) => Promise<void>;
    onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>;
}

export default function EditUserModal({
    isOpen,
    user,
    onClose,
    onSubmit,
    onDelete,
    onResendInvite,
    onToggleStatus
}: EditUserModalProps) {
    const [name, setName] = useState("");
    const [role, setRole] = useState<UserRole>("manager");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.name);
            setRole(user.role);
            setPhoneNumber(user.phoneNumber || "");
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Please enter a name");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(user.id, name.trim(), role, phoneNumber.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAction = async (action: () => Promise<void>) => {
        setIsSubmitting(true);
        setError("");
        try {
            await action();
            onClose();
        } catch (err: any) {
            setError(err.message || "Action failed");
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setError("");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(cleanInput(e.target.value))}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="Enter full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="edit-email"
                            value={user.email || ""}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                            Assign Role
                        </label>
                        <select
                            id="edit-role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                        >
                            <option value="admin">Administrator</option>
                            <option value="manager">Farm Manager</option>
                            <option value="customer">Customer</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number (WhatsApp)
                        </label>
                        <input
                            type="text"
                            id="edit-phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(cleanInput(e.target.value))}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="e.g. 9779841..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code (e.g. 977) for WhatsApp notifications.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">More Actions</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {user.email && (
                                <button
                                    type="button"
                                    onClick={() => handleAction(() => onResendInvite(user.email!))}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                >
                                    Resend Invitation
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleAction(() => onToggleStatus(user.id, user.isActive))}
                                disabled={isSubmitting}
                                className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${user.isActive
                                    ? "text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-100"
                                    : "text-green-600 bg-green-50 hover:bg-green-100 border-green-100"
                                    }`}
                            >
                                {user.isActive ? "Deactivate User" : "Activate User"}
                            </button>
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => handleAction(() => onDelete(user.id))}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                >
                                    Delete User
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
