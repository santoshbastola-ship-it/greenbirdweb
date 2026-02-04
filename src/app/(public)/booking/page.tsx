"use client";

import { useState } from "react";
import { BookingService } from "@/services/booking.service";
import { Calendar, Users, Phone, Mail, User, Info, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTodayNepali } from "@/lib/date-helper";
import dynamic from 'next/dynamic';

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" />
});

import "nepali-datepicker-reactjs/dist/index.css";

export default function BookingPage() {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.displayName || "",
        email: user?.email || "",
        phone: "",
        checkInDate: getTodayNepali(),
        checkOutDate: "",
        guests: 1,
        specialRequests: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await BookingService.createBooking({
                ...formData,
                customerId: user?.uid
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Booking error:", error);
            alert("Failed to submit booking. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-green-100 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Received!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Thank you for choosing Greenbird Homestead. Our team will review your request
                        and contact you shortly to confirm your stay.
                    </p>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="w-full bg-[#2D5A27] text-white py-4 rounded-xl font-bold hover:bg-[#1f3e1b] transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* Info Side */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-[#2D5A27] mb-6 font-primary uppercase tracking-tight">
                                Book Your <span className="text-[#5C4033]">Homestead</span> Visit
                            </h1>
                            <div className="space-y-4 font-geist">
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    Experience authentic farm life in the heart of the Kathmandu Valley.
                                    Immerse yourself in the sounds of nature and enjoy farm-fresh meals collected
                                    by your own hands.
                                </p>
                                <p className="text-base text-gray-600 leading-relaxed bg-[#2D5A27]/5 p-4 rounded-xl border-l-4 border-[#2D5A27]">
                                    <span className="font-bold text-[#2D5A27] block mb-1">Note</span>
                                    While we do not currently offer overnight accommodations, we invite you to enjoy our day activities until late evening.
                                    <span className="block mt-2 text-sm opacity-90">
                                        🚗 Pick-up and drop-off services available at Rs 100 per km.
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FeatureCard
                                icon={<Calendar className="h-6 w-6 text-[#2D5A27]" />}
                                title="Flexible Dates"
                                description="Adjust your visit as per availability with our easy booking system."
                            />
                            <FeatureCard
                                icon={<Users className="h-6 w-6 text-[#2D5A27]" />}
                                title="Group Visits"
                                description="We welcome families and small groups for a unified farm experience."
                            />
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#2D5A27]/5 font-geist">
                            <h3 className="text-xl font-bold text-[#2D5A27] mb-4">What's Included?</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-600">
                                    <div className="h-2 w-2 bg-[#5C4033] rounded-full"></div>
                                    Farm-to-table breakfast
                                </li>
                                <li className="flex items-center gap-3 text-gray-600">
                                    <div className="h-2 w-2 bg-[#5C4033] rounded-full"></div>
                                    Guided farm tour & activities
                                </li>
                                <li className="flex items-center gap-3 text-gray-600">
                                    <div className="h-2 w-2 bg-[#5C4033] rounded-full"></div>
                                    Authentic rural atmosphere
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white relative overflow-hidden font-geist">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2D5A27]/5 rounded-bl-full -mr-10 -mt-10"></div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            Reservation Request
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <User className="h-4 w-4 opacity-50" /> Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27] transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="h-4 w-4 opacity-50" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27] transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone className="h-4 w-4 opacity-50" /> Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27] transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4 opacity-50" /> Total Guests
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27] transition-all"
                                        value={formData.guests}
                                        onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Check-in Date</label>
                                    <div className="nepali-datepicker-container">
                                        <NepaliDatePicker
                                            value={formData.checkInDate}
                                            onChange={(date: string) => setFormData({ ...formData, checkInDate: date })}
                                            options={{ calenderLocale: "en", valueLocale: "en" }}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27] transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Check-out Date</label>
                                    <div className="nepali-datepicker-container">
                                        <NepaliDatePicker
                                            value={formData.checkOutDate}
                                            onChange={(date: string) => setFormData({ ...formData, checkOutDate: date })}
                                            options={{ calenderLocale: "en", valueLocale: "en" }}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27] transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Info className="h-4 w-4 opacity-50" /> Special Requests (Optional)
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5A27] transition-all"
                                    rows={3}
                                    value={formData.specialRequests}
                                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#2D5A27] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#1f3e1b] transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-[#2D5A27]/20"
                            >
                                {submitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>Book Now <Calendar className="h-5 w-5" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#2D5A27]/5 hover:shadow-md transition-shadow font-geist">
            <div className="bg-[#2D5A27]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                {icon}
            </div>
            <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-500 leading-relaxed font-geist">{description}</p>
        </div>
    );
}
