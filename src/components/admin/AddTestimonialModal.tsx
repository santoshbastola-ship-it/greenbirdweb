"use client";

import { useState } from "react";
import { X, Upload, Loader2, Link as LinkIcon } from "lucide-react";
import { addTestimonial, uploadTestimonialPhoto } from "@/lib/services/testimonials";
import { Testimonial } from "@/types/extra";
import { cleanInput } from "@/lib/input-validation";

interface AddTestimonialModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTestimonialModal({ onClose, onSuccess }: AddTestimonialModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        content: "",
        customerProfileUrl: "",
        date: new Date().toISOString().split('T')[0],
        isPublished: true
    });
    const [photo, setPhoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!photo && !previewUrl) {
            alert("Please upload a photo");
            return;
        }

        setLoading(true);
        try {
            let photoUrl = "";
            if (photo) {
                photoUrl = await uploadTestimonialPhoto(photo);
            }

            await addTestimonial({
                ...formData,
                photoUrl,
                date: new Date(formData.date),
                createdAt: new Date()
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add testimonial:", error);
            alert("Failed to add testimonial. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Add Testimonial</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Customer Photo</label>
                        <div className="flex items-center gap-4">
                            <div className="relative h-24 w-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <Upload className="h-8 w-8 text-gray-300" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="text-sm text-gray-500">
                                <p className="font-medium text-gray-700">Click to upload photo</p>
                                <p>Square aspect ratio recommended</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Customer Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: cleanInput(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Testimonial Content</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: cleanInput(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-none"
                                placeholder="Share the customer's experience..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" /> Customer Profile / Social URL (Optional)
                            </label>
                            <input
                                type="url"
                                value={formData.customerProfileUrl}
                                onChange={(e) => setFormData({ ...formData, customerProfileUrl: cleanInput(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                placeholder="https://facebook.com/johndoe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Experience Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isPublished}
                                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="rounded text-green-600 focus:ring-green-500 h-5 w-5"
                            />
                            <span className="text-sm font-medium text-gray-700">Publish immediately</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Testimonial"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
