"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MessageSquare, Quote, Eye, EyeOff, ExternalLink, Calendar as CalendarIcon, User } from "lucide-react";
import { getTestimonials, deleteTestimonial, updateTestimonialStatus } from "@/lib/services/testimonials";
import { Testimonial } from "@/types/extra";
import LogoLoader from "@/components/ui/LogoLoader";
import AddTestimonialModal from "@/components/admin/AddTestimonialModal";
import { format } from "date-fns";

export default function TestimonialsAdminPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadTestimonials();
    }, []);

    const loadTestimonials = async () => {
        setLoading(true);
        try {
            const data = await getTestimonials();
            setTestimonials(data);
        } catch (error) {
            console.error("Failed to load testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this testimonial?")) {
            try {
                await deleteTestimonial(id);
                setTestimonials(testimonials.filter(t => t.id !== id));
            } catch (error) {
                alert("Failed to delete testimonial");
            }
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateTestimonialStatus(id, !currentStatus);
            setTestimonials(testimonials.map(t =>
                t.id === id ? { ...t, isPublished: !currentStatus } : t
            ));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="space-y-8 pt-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customer Testimonials</h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-100 font-semibold text-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Testimonial
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <LogoLoader />
                </div>
            ) : testimonials.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 italic font-medium text-gray-400">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    No testimonials yet. Add your first customer feedback!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group">
                            <div className="p-6 flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                                            {testimonial.photoUrl ? (
                                                <img src={testimonial.photoUrl} alt={testimonial.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                    <User className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{testimonial.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <CalendarIcon className="h-3 w-3" />
                                                {format(new Date(testimonial.date), "MMM dd, yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                    <Quote className="h-8 w-8 text-green-100 group-hover:text-green-200 transition-colors" />
                                </div>

                                <p className="text-gray-600 italic leading-relaxed line-clamp-4">
                                    "{testimonial.content}"
                                </p>

                                {testimonial.customerProfileUrl && (
                                    <a
                                        href={testimonial.customerProfileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Customer Profile
                                    </a>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => handleToggleStatus(testimonial.id, testimonial.isPublished)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${testimonial.isPublished
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                        }`}
                                >
                                    {testimonial.isPublished ? (
                                        <><Eye className="h-4 w-4" /> Published</>
                                    ) : (
                                        <><EyeOff className="h-4 w-4" /> Draft</>
                                    )}
                                </button>

                                <button
                                    onClick={() => handleDelete(testimonial.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <AddTestimonialModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={loadTestimonials}
                />
            )}
        </div>
    );
}
