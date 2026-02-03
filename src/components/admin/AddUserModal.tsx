"use client";

import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { UserRole } from "@/types";
import { cleanInput } from "@/lib/input-validation";

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string, name: string, role: UserRole, phoneNumber?: string) => Promise<void>;
}

export default function AddUserModal({ isOpen, onClose, onSubmit }: AddUserModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<UserRole>("manager");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name.trim() || !email.trim()) {
            setError("Please fill in all fields");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(email.trim(), name.trim(), role, phoneNumber.trim());
            setSuccess("User added successfully! They can now log in using their email link.");
            // Reset form after a delay
            setTimeout(() => {
                setName("");
                setEmail("");
                setPhoneNumber("");
                setRole("manager");
                setSuccess("");
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to invite user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setName("");
            setEmail("");
            setPhoneNumber("");
            setPassword("");
            setRole("manager");
            setError("");
            setSuccess("");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Invite New User</h2>
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

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(cleanInput(e.target.value))}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="Enter full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(cleanInput(e.target.value))}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="user@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            Assign Role
                        </label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                        >
                            <option value="admin">Administrator</option>
                            <option value="manager">Farm Manager</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number (WhatsApp)
                        </label>
                        <input
                            type="text"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(cleanInput(e.target.value))}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="e.g. 9779841..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code (e.g. 977) for WhatsApp notifications.</p>
                    </div>



                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Inviting..." : "Invite User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
