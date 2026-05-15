"use client";

import { useState, useEffect } from "react";
import { BookingService } from "@/services/booking.service";
import { Booking, BookingStatus } from "@/types/extra";
import {
    Calendar,
    User as UserIcon,
    Phone,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Check,
    X,
    Filter,
    MoreVertical,
    Pencil,
    Plus,
    Users,
    Trash2
} from "lucide-react";
import LogoLoader from "@/components/ui/LogoLoader";
import BookingModal from "@/components/admin/BookingModal";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import NepaliDate from "nepali-date-converter";
import { toNepali } from "@/lib/date-helper";
import { Toast, ToastType } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { FilterTab } from "@/components/ui/FilterTab";

export default function BookingManagementPage() {
    const { dbUser } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };

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
            showToast("Failed to load bookings", "error"); // Added toast for loading error
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this booking?")) {
            try {
                await BookingService.deleteBooking(id, dbUser?.name || "Admin");
                setBookings(bookings.filter(b => b.id !== id));
                showToast("Booking deleted successfully");
            } catch (error) {
                console.error("Error deleting booking:", error);
                showToast("Failed to delete booking", "error");
            }
        }
    };

    const handleStatusChange = async (id: string, status: BookingStatus) => {
        try {
            await BookingService.updateBookingStatus(id, status, dbUser?.name || "Admin");
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status } : b
            ));
            showToast("Booking status updated successfully");
        } catch (error) {
            console.error("Error updating booking:", error);
            showToast("Failed to update booking status", "error");
        }
    };


    const filteredBookings = bookings.filter(b => {
        const matchesQuery = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

        // Date Filtering (Using Check-in Date)
        const checkInDate = new Date(b.checkInDate);
        const matchesStartDate = !startDate || checkInDate >= new NepaliDate(startDate).toJsDate();
        const matchesEndDate = !endDate || checkInDate <= new Date(new NepaliDate(endDate).toJsDate().setHours(23, 59, 59, 999));

        return matchesQuery && matchesStatus && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getTabCount = (status: BookingStatus | 'all') => {
        return bookings.filter(b => status === 'all' || b.status === status).length;
    };

    const tabs: { label: string; status: BookingStatus | 'all' }[] = [
        { label: "All", status: "all" },
        { label: "Pending", status: "pending" },
        { label: "Confirmed", status: "confirmed" },
        { label: "Completed", status: "completed" },
        { label: "Cancelled", status: "cancelled" },
    ];

    return (
        <div className="space-y-8 pt-4">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
                </div>
                <button
                    onClick={() => {
                        setSelectedBooking(undefined);
                        setIsBookingModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium whitespace-nowrap"
                >
                    <Plus className="h-5 w-5" />
                    New Booking
                </button>
            </div>

            {/* Filters */}
            <AdvancedSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                placeholder="Search"
            />

            {/* Tabs */}
            <div className="mb-6 -mx-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => (
                        <FilterTab
                            key={tab.status}
                            label={tab.label}
                            count={getTabCount(tab.status)}
                            active={statusFilter === tab.status}
                            onClick={() => setStatusFilter(tab.status)}
                        />
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <LogoLoader />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No {statusFilter === "all" ? "" : statusFilter} bookings found</h3>
                    <p className="text-gray-500">Bookings matching your criteria will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onUpdateStatus={handleStatusChange}
                            onEdit={(b) => {
                                setSelectedBooking(b);
                                setIsBookingModalOpen(true);
                            }}
                            onDelete={dbUser?.email === "santoshbastola@gmail.com" ? () => handleDelete(booking.id) : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Booking Modal (Create/Edit) */}
            {isBookingModalOpen && (
                <BookingModal
                    booking={selectedBooking}
                    onClose={() => {
                        setIsBookingModalOpen(false);
                        setSelectedBooking(undefined);
                    }}
                    onSuccess={() => {
                        loadBookings();
                        showToast(selectedBooking ? "Booking updated successfully!" : "Booking created successfully!");
                    }}
                />
            )}
        </div>
    );
}

function BookingCard({
    booking,
    onUpdateStatus,
    onEdit,
    onDelete
}: {
    booking: Booking;
    onUpdateStatus: (id: string, status: BookingStatus) => void;
    onEdit: (booking: Booking) => void;
    onDelete?: () => void;
}) {
    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'confirmed': return 'bg-green-50 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
            case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between gap-3">
                {/* Guest & Stay Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 text-green-600 border border-green-100 font-bold">
                        {booking.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{booking.name}</h3>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(booking.status)} uppercase tracking-wider`}>
                                {booking.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                            <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{booking.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{booking.guests} Guests</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{toNepali(booking.checkInDate, "DD MMM YYYY")} - {toNepali(booking.checkOutDate, "DD MMM YYYY")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & More Info */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:block text-right mr-2">
                        <div className="text-[10px] text-gray-400 font-bold tracking-tight uppercase">Stay Dates (B.S.)</div>
                        <div className="text-xs font-medium text-gray-700">
                            {toNepali(booking.checkInDate, "DD MMM")} - {toNepali(booking.checkOutDate, "DD MMM")}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {booking.status === 'pending' && (
                            <button
                                onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                title="Confirm"
                            >
                                <Check className="h-4 w-4" />
                            </button>
                        )}
                        {booking.status === 'confirmed' && (
                            <button
                                onClick={() => onUpdateStatus(booking.id, 'completed')}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                title="Complete"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                            </button>
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button
                                onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Cancel"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                        <button
                            onClick={() => onEdit(booking)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="Edit"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>

                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}

                    </div>
                </div>
            </div>

            {/* Mobile Stay Date & Requests */}
            <div className="mt-2 sm:hidden flex flex-col gap-1 border-t border-gray-50 pt-2">
                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>{toNepali(booking.checkInDate, "DD MMM YYYY")} - {toNepali(booking.checkOutDate, "DD MMM YYYY")}</span>
                </div>
            </div>

            {booking.specialRequests && (
                <div className="mt-2 text-[10px] text-gray-500 bg-amber-50/50 p-1.5 rounded border border-amber-100/50 italic flex items-start gap-1">
                    <span className="font-bold text-amber-600 mr-1 shrink-0">Note:</span>
                    <span className="line-clamp-1">{booking.specialRequests}</span>
                </div>
            )}
        </div>
    );
}
