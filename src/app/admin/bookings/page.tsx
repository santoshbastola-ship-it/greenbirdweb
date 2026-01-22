"use client";

import { useState, useEffect } from "react";
import { BookingService } from "@/services/booking.service";
import { Booking, BookingStatus } from "@/types/extra";
import {
    Calendar,
    User,
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
    Filter
} from "lucide-react";

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadBookings();
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
                                <tr>
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
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
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
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                            No bookings found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
