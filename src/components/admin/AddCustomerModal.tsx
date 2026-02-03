"use client";

import { useState } from "react";
import { X, User as UserIcon, Phone, MapPin, Mail, Save } from "lucide-react";
import { User } from "@/types";
import { UserService } from "@/services/user.service";
import { cleanInput } from "@/lib/input-validation";

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (customer: User) => void;
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const customerData = {
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                address: address.trim(),
                email: email.trim() || undefined,
                partnerType: "customer" as const
            };

            const newCustomerId = await UserService.createCustomer(customerData);

            // Construct the new user object to pass back
            // We can fetch it properly or construct it if we trust the return
            // Let's fetch it to be sure we have the transform logic (timestamps etc) correct
            const newUser = await UserService.getUserById(newCustomerId);

            if (newUser) {
                onSuccess(newUser);
                handleClose();
            } else {
                throw new Error("Failed to retrieve created customer");
            }

        } catch (err: any) {
            console.error("Error adding customer:", err);
            setError(err.message || "Failed to add customer");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setName("");
            setPhoneNumber("");
            setAddress("");
            setEmail("");
            setError("");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Enter details for new customer</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                            <span className="mt-0.5">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="new-name" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-gray-400" /> Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="new-name"
                                value={name}
                                onChange={(e) => setName(cleanInput(e.target.value))}
                                disabled={isSubmitting}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
                                placeholder="Enter customer name"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="new-phone" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" /> Phone Number
                            </label>
                            <input
                                type="tel"
                                id="new-phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(cleanInput(e.target.value))}
                                disabled={isSubmitting}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
                                placeholder="e.g. 98xxxxxxxx"
                            />
                        </div>

                        <div>
                            <label htmlFor="new-address" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" /> Address
                            </label>
                            <input
                                type="text"
                                id="new-address"
                                value={address}
                                onChange={(e) => setAddress(cleanInput(e.target.value))}
                                disabled={isSubmitting}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
                                placeholder="e.g. Kathmandu, Nepal"
                            />
                        </div>

                        <div>
                            <label htmlFor="new-email" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" /> Email (Optional)
                            </label>
                            <input
                                type="email"
                                id="new-email"
                                value={email}
                                onChange={(e) => setEmail(cleanInput(e.target.value))}
                                disabled={isSubmitting}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
                                placeholder="customer@example.com"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100 mb-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Creating..." : <><Save className="h-5 w-5" /> Create Customer</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
