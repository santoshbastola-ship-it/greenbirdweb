"use client";

import { useState, useEffect } from "react";
import { BookingService } from "@/services/booking.service";
import { UserService } from "@/services/user.service";
import { Booking, BookingStatus } from "@/types/extra";
import { User } from "@/types";
import {
    Calendar,
    User as UserIcon,
    Phone,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Search,
    Loader2,
    Check,
    X,
    Filter,
    Plus
} from "lucide-react";

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState("");

    // New Booking Modal State
    const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
    const [customers, setCustomers] = useState<User[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [newBookingData, setNewBookingData] = useState({
        customerId: "",
        checkInDate: "",
        checkOutDate: "",
        guests: 1,
        specialRequests: ""
    });
    const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');
    const [newCustomerData, setNewCustomerData] = useState({
        name: "",
        email: "",
        phoneNumber: ""
    });
    const [creatingBooking, setCreatingBooking] = useState(false);

    useEffect(() => {
        loadBookings();
        loadCustomers();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await BookingService.getAllBookings();
            setBookings(data);
        } catch (error) {
            console.error("Error loading bookings:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleUpdateStatus = async (id: string, status: BookingStatus) => {
        try {
            await BookingService.updateBookingStatus(id, status);
            loadBookings();
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Failed to update booking status");
        }
    };

    const handleDelete = async (booking: Booking) => {
        if (!confirm(`Are you sure you want to delete the booking for ${booking.name}?`)) return;
        try {
            await BookingService.deleteBooking(booking.id);
            loadBookings();
        } catch (error) {
            console.error("Error deleting booking:", error);
            alert("Failed to delete booking");
        }
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        if (customerType === 'existing' && !newBookingData.customerId) {
            alert("Please select a customer");
            return;
        }

        if (customerType === 'new' && (!newCustomerData.name || !newCustomerData.phoneNumber)) {
            alert("Please fill in customer name and phone number");
            return;
        }

        if (!newBookingData.checkInDate || !newBookingData.checkOutDate) {
            alert("Please fill in stay dates");
            return;
        }

        setCreatingBooking(true);
        try {
            let customerId = newBookingData.customerId;
            let customerName = "";
            let customerEmail = "";
            let customerPhone = "";

            if (customerType === 'new') {
                // Create new customer first
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

                // Refresh customer list in background
                loadCustomers();
            } else {
                const selectedCustomer = customers.find(c => c.id === newBookingData.customerId);
                if (!selectedCustomer) {
                    alert("Selected customer not found");
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
                checkInDate: new Date(newBookingData.checkInDate),
                checkOutDate: new Date(newBookingData.checkOutDate),
                guests: Number(newBookingData.guests),
                specialRequests: newBookingData.specialRequests
            });

            // Reset and close
            setNewBookingData({
                customerId: "",
                checkInDate: "",
                checkOutDate: "",
                guests: 1,
                specialRequests: ""
            });
            setNewCustomerData({
                name: "",
                email: "",
                phoneNumber: ""
            });
            setCustomerType('existing');
            setIsNewBookingOpen(false);
            loadBookings();
            alert("Booking created successfully!");
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Failed to create booking");
        } finally {
            setCreatingBooking(false);
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesQuery = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || b.status === filter;
        return matchesQuery && matchesFilter;
    });

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'confirmed': return 'bg-green-50 text-green-700 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            case 'completed': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
                    <p className="text-gray-500">Manage homestead stay requests</p>
                </div>
                <button
                    onClick={() => setIsNewBookingOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    New Booking
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 font-geist">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                        className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white font-geist"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-geist">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <tr className="font-geist">
                                    <th className="px-6 py-4">Guest Information</th>
                                    <th className="px-6 py-4">Stay Dates</th>
                                    <th className="px-6 py-4">Guests</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created At</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors font-geist">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{booking.name}</span>
                                                <span className="text-sm text-gray-500">{booking.email}</span>
                                                <span className="text-xs text-gray-500">{booking.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex flex-col">
                                                <span>{new Date(booking.checkInDate).toLocaleDateString()}</span>
                                                <span className="text-xs text-gray-400">to {new Date(booking.checkOutDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {booking.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Confirm"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Complete"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(booking)}
                                                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-geist">
                                            No bookings found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Booking Modal */}
            {isNewBookingOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">Create New Booking</h2>
                            <button
                                onClick={() => setIsNewBookingOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
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

                            {customerType === 'existing' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                        value={newBookingData.customerId}
                                        onChange={(e) => setNewBookingData({ ...newBookingData, customerId: e.target.value })}
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
                                            onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
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
                                                onChange={(e) => setNewCustomerData({ ...newCustomerData, phoneNumber: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                            <input
                                                type="email"
                                                placeholder="Email address"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                                value={newCustomerData.email}
                                                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                        value={newBookingData.checkInDate}
                                        onChange={(e) => setNewBookingData({ ...newBookingData, checkInDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                                        value={newBookingData.checkOutDate}
                                        min={newBookingData.checkInDate}
                                        onChange={(e) => setNewBookingData({ ...newBookingData, checkOutDate: e.target.value })}
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
                                    value={newBookingData.guests}
                                    onChange={(e) => setNewBookingData({ ...newBookingData, guests: Number(e.target.value) })}
                                    placeholder="Enter number of guests"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none h-24 resize-none"
                                    value={newBookingData.specialRequests}
                                    onChange={(e) => setNewBookingData({ ...newBookingData, specialRequests: e.target.value })}
                                    placeholder="Any special requirements..."
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsNewBookingOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingBooking}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {creatingBooking ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Booking'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
