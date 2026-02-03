"use client";

import { useState, useEffect } from "react";
import { BookingService } from "@/services/booking.service";
import { UserService } from "@/services/user.service";
import { User } from "@/types";
import { Booking } from "@/types/extra";
import { Loader2, X } from "lucide-react";
import dynamic from 'next/dynamic';
import NepaliDate from "nepali-date-converter";
import "nepali-datepicker-reactjs/dist/index.css";
import { Toast, ToastType } from "@/components/ui/Toast";
import { cleanInput } from "@/lib/input-validation";

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
});

interface BookingModalProps {
    booking?: Booking;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BookingModal({ booking, onClose, onSuccess }: BookingModalProps) {
    const isEdit = !!booking;
    const [customers, setCustomers] = useState<User[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    const [formData, setFormData] = useState({
        customerId: booking?.customerId || "",
        checkInDate: booking ? new NepaliDate(new Date(booking.checkInDate)).format("YYYY-MM-DD") : "",
        checkOutDate: booking ? new NepaliDate(new Date(booking.checkOutDate)).format("YYYY-MM-DD") : "",
        guests: booking?.guests || 1,
        specialRequests: booking?.specialRequests || ""
    });

    const [customerType, setCustomerType] = useState<'existing' | 'new'>(isEdit ? 'existing' : 'existing');
    const [newCustomerData, setNewCustomerData] = useState({
        name: "",
        email: "",
        phoneNumber: ""
    });

    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const data = await UserService.getAllCustomers();
            setCustomers(data);
        } catch (error) {
            console.error("Error loading customers:", error);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEdit && customerType === 'existing' && !formData.customerId) {
            showToast("Please select a customer", "error");
            return;
        }

        if (!isEdit && customerType === 'new' && (!newCustomerData.name || !newCustomerData.phoneNumber)) {
            showToast("Please fill in customer name and phone number", "error");
            return;
        }

        if (!formData.checkInDate || !formData.checkOutDate) {
            showToast("Please fill in stay dates", "error");
            return;
        }

        setProcessing(true);
        try {
            if (isEdit) {
                // Update existing booking
                await BookingService.updateBooking(booking.id, {
                    checkInDate: new NepaliDate(formData.checkInDate).toJsDate().toISOString(),
                    checkOutDate: new NepaliDate(formData.checkOutDate).toJsDate().toISOString(),
                    guests: Number(formData.guests),
                    specialRequests: formData.specialRequests
                });
                showToast("Booking updated successfully");
            } else {
                // Create new booking
                let customerId = formData.customerId;
                let customerName = "";
                let customerEmail = "";
                let customerPhone = "";

                if (customerType === 'new') {
                    const newId = await UserService.createCustomer({
                        name: newCustomerData.name,
                        email: newCustomerData.email,
                        phoneNumber: newCustomerData.phoneNumber,
                        partnerType: 'customer'
                    });
                    customerId = newId;
                    customerName = newCustomerData.name;
                    customerEmail = newCustomerData.email || "no-email@example.com";
                    customerPhone = newCustomerData.phoneNumber;
                } else {
                    const selectedCustomer = customers.find(c => c.id === formData.customerId);
                    if (!selectedCustomer) {
                        showToast("Selected customer not found", "error");
                        setProcessing(false);
                        return;
                    }
                    customerName = selectedCustomer.name;
                    customerEmail = selectedCustomer.email || "no-email@example.com";
                    customerPhone = selectedCustomer.phoneNumber || "N/A";
                }

                await BookingService.createBooking({
                    customerId,
                    name: customerName,
                    email: customerEmail,
                    phone: customerPhone,
                    checkInDate: new NepaliDate(formData.checkInDate).toJsDate().toISOString(),
                    checkOutDate: new NepaliDate(formData.checkOutDate).toJsDate().toISOString(),
                    guests: Number(formData.guests),
                    specialRequests: formData.specialRequests
                });
                showToast("Booking created successfully");
            }

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Error processing booking:", error);
            showToast(isEdit ? "Failed to update booking" : "Failed to create booking", "error");
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Booking" : "Create New Booking"}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {!isEdit && (
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => setCustomerType('existing')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${customerType === 'existing'
                                    ? 'bg-white text-green-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Existing Customer
                            </button>
                            <button
                                type="button"
                                onClick={() => setCustomerType('new')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${customerType === 'new'
                                    ? 'bg-white text-green-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                New Customer
                            </button>
                        </div>
                    )}

                    {!isEdit ? (
                        customerType === 'existing' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                    value={formData.customerId}
                                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.email || 'No email'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Guest's full name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                        value={newCustomerData.name}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: cleanInput(e.target.value) })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="Phone"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                            value={newCustomerData.phoneNumber}
                                            onChange={(e) => setNewCustomerData({ ...newCustomerData, phoneNumber: cleanInput(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                            value={newCustomerData.email}
                                            onChange={(e) => setNewCustomerData({ ...newCustomerData, email: cleanInput(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <div className="text-sm font-medium text-green-800">{booking.name}</div>
                            <div className="text-xs text-green-600">{booking.phone} | {booking.email}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date (B.S.)</label>
                            <NepaliDatePicker
                                value={formData.checkInDate}
                                onChange={(date: string) => setFormData({ ...formData, checkInDate: date })}
                                options={{ calenderLocale: "en", valueLocale: "en" }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date (B.S.)</label>
                            <NepaliDatePicker
                                value={formData.checkOutDate}
                                onChange={(date: string) => setFormData({ ...formData, checkOutDate: date })}
                                options={{ calenderLocale: "en", valueLocale: "en" }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                            value={formData.guests}
                            onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                            placeholder="Enter number of guests"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none h-24 resize-none"
                            value={formData.specialRequests}
                            onChange={(e) => setFormData({ ...formData, specialRequests: cleanInput(e.target.value) })}
                            placeholder="Any special requirements..."
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isEdit ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                isEdit ? 'Update Booking' : 'Create Booking'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
