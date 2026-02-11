"use client";

import { useState } from "react";
import { X, Image as ImageIcon, Loader2, Play, Video } from "lucide-react";
import { uploadMedia, addActivity } from "@/lib/services/activities";
import { format } from "date-fns";
import { cleanInput } from "@/lib/input-validation";
import ImageCropperModal from "./ImageCropperModal";

interface AddActivityModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface MediaFile {
    file: File;
    preview: string;
    type: 'image' | 'video';
}

export default function AddActivityModal({ onClose, onSuccess }: AddActivityModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isPublished, setIsPublished] = useState(true);
    const [saving, setSaving] = useState(false);

    // Cropping States
    const [croppingImage, setCroppingImage] = useState<{ src: string; file: File } | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileList = Array.from(files);
        processFiles(fileList);
    };

    const processFiles = (files: File[]) => {
        if (files.length === 0) return;

        const nextFile = files[0];
        const remaining = files.slice(1);

        if (nextFile.type.startsWith('video/')) {
            // Videos don't need cropping
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaFiles(prev => [...prev, {
                    file: nextFile,
                    preview: reader.result as string,
                    type: 'video'
                }]);
                processFiles(remaining);
            };
            reader.readAsDataURL(nextFile);
        } else {
            // Images go through cropper
            const reader = new FileReader();
            reader.onloadend = () => {
                setCroppingImage({
                    src: reader.result as string,
                    file: nextFile
                });
                setPendingFiles(remaining);
            };
            reader.readAsDataURL(nextFile);
        }
    };

    const onCropComplete = (croppedBlob: Blob) => {
        if (!croppingImage) return;

        const croppedFile = new File([croppedBlob], croppingImage.file.name, {
            type: 'image/jpeg'
        });

        setMediaFiles(prev => [...prev, {
            file: croppedFile,
            preview: URL.createObjectURL(croppedBlob),
            type: 'image'
        }]);

        setCroppingImage(null);
        if (pendingFiles.length > 0) {
            processFiles(pendingFiles);
        }
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mediaFiles.length === 0) {
            alert("Please select at least one image or video");
            return;
        }

        try {
            setSaving(true);

            // Upload all media files
            const uploadedMedia = await Promise.all(
                mediaFiles.map(m => uploadMedia(m.file))
            );

            await addActivity({
                title,
                description,
                imageUrl: uploadedMedia[0].url, // Store first image/video thumbnail as main image for compatibility
                media: uploadedMedia,
                date: new Date(date),
                createdAt: new Date(),
                isPublished,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add activity", error);
            alert("Failed to add activity. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                {croppingImage && (
                    <ImageCropperModal
                        imageSrc={croppingImage.src}
                        aspect={16 / 9} // Widescreen for activities
                        onCropComplete={onCropComplete}
                        onClose={() => {
                            setCroppingImage(null);
                            if (pendingFiles.length > 0) processFiles(pendingFiles);
                        }}
                    />
                )}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Add New Activity</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(cleanInput(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                placeholder="Harvesting Season 2024"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(cleanInput(e.target.value))}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                            placeholder="Details about what happened on the farm..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Activity Photos & Videos</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500">Upload Media</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleMediaChange}
                                />
                            </label>

                            {mediaFiles.map((media, index) => (
                                <div key={index} className="aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group">
                                    {media.type === 'image' ? (
                                        <img src={media.preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <Video className="h-8 w-8 text-gray-400" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <Play className="h-8 w-8 text-white fill-white" />
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-md backdrop-blur-sm">
                                        {media.type.toUpperCase()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublished"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Publish immediately
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-[2] bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-sm gradient-green"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                                </>
                            ) : (
                                "Save Activity"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .gradient-green {
                    background: linear-gradient(135deg, #2D5A27 0%, #4a8c41 100%);
                }
            `}</style>
        </div>
    );
}

