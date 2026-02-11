"use client";

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, RotateCcw } from 'lucide-react';

interface ImageCropperModalProps {
    imageSrc: string;
    aspect: number;
    onCropComplete: (croppedImage: Blob) => void;
    onClose: () => void;
}

export default function ImageCropperModal({ imageSrc, aspect, onCropComplete, onClose }: ImageCropperModalProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    // Initialize crop when image loads
    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                aspect,
                width,
                height
            ),
            width,
            height
        );
        setCrop(initialCrop);
    }

    async function getCroppedImg() {
        if (!imgRef.current || !completedCrop) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    resolve(blob);
                },
                'image/webp',
                0.90
            );
        });
    }

    const handleSave = async () => {
        try {
            const croppedBlob = await getCroppedImg();
            if (croppedBlob) {
                onCropComplete(croppedBlob);
            }
        } catch (e) {
            console.error('Error cropping image:', e);
            alert('Failed to crop image. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Crop Image</h2>
                        <p className="text-sm text-gray-500 mt-1">Adjust the frame to select the best part of your photo.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                {/* Cropping Area */}
                <div className="flex-1 overflow-auto p-8 bg-gray-50 flex items-center justify-center min-h-[400px]">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        className="max-h-full"
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop me"
                            onLoad={onImageLoad}
                            className="max-h-[60vh] w-auto object-contain"
                        />
                    </ReactCrop>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white">
                    <button
                        onClick={() => {
                            // Reset crop
                            if (imgRef.current) {
                                const { width, height } = imgRef.current;
                                setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height));
                            }
                        }}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                        <RotateCcw className="h-4 w-4" /> Reset
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
                        >
                            <Check className="h-5 w-5" /> Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
