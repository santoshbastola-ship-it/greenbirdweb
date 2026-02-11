"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2, Eye } from "lucide-react";
import { UploadService } from "@/services/upload.service";

interface DocumentUploadProps {
    label?: string;
    documentUrls: string[];
    onChange: (urls: string[]) => void;
    folder?: string;
    maxFiles?: number;
}

export default function DocumentUpload({
    label = "Upload Bills/Documents",
    documentUrls,
    onChange,
    folder = "bills",
    maxFiles = 5
}: DocumentUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileList = Array.from(files);

        // Check if adding these would exceed max
        if (documentUrls.length + fileList.length > maxFiles) {
            alert(`You can only upload up to ${maxFiles} documents.`);
            return;
        }

        setUploading(true);
        try {
            const uploadPromises = fileList.map(file => UploadService.uploadDocument(file, folder));
            const newUrls = await Promise.all(uploadPromises);

            onChange([...documentUrls, ...newUrls]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Some files failed to upload. Please try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeDocument = (index: number) => {
        const newUrls = [...documentUrls];
        newUrls.splice(index, 1);
        onChange(newUrls);
    };

    const isImage = (url: string) => {
        return url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || url.includes(".webp");
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                {label}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Button */}
                {documentUrls.length < maxFiles && (
                    <div
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={`border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,application/pdf"
                            multiple
                            className="hidden"
                        />
                        {uploading ? (
                            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
                        ) : (
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-600">
                            {uploading ? "Uploading..." : "Click to upload"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Bills are converted to small WebP files
                        </p>
                    </div>
                )}

                {/* Document Previews */}
                <div className="space-y-2">
                    {documentUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl group relative">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                                {isImage(url) ? (
                                    <img src={url} alt="Bill" className="w-full h-full object-cover" />
                                ) : (
                                    <FileText className="h-6 w-6 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500 truncate">Document {index + 1}</p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <Eye className="h-3 w-3" /> View
                                </a>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {documentUrls.length === 0 && !uploading && (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-50 rounded-xl min-h-[120px]">
                            <p className="text-xs text-gray-400">No documents uploaded</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
