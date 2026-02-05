"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
    images: string[];
    productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const safeImages = Array.isArray(images) ? images : [];
    const hasMultipleImages = safeImages.length > 1;
    const displayImages = safeImages.length > 0 ? safeImages : ["/placeholder.png"];

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const index = Math.round(
                scrollContainerRef.current.scrollLeft / scrollContainerRef.current.offsetWidth
            );
            setActiveIndex(index);
        }
    };

    const scrollToImage = (index: number) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                left: index * scrollContainerRef.current.offsetWidth,
                behavior: "smooth",
            });
        }
    };

    const nextImage = () => {
        if (activeIndex < displayImages.length - 1) {
            scrollToImage(activeIndex + 1);
        }
    };

    const prevImage = () => {
        if (activeIndex > 0) {
            scrollToImage(activeIndex - 1);
        }
    };

    return (
        <div className="relative group bg-gray-100 aspect-square md:aspect-auto h-full overflow-hidden rounded-3xl md:rounded-l-3xl md:rounded-r-none">
            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {displayImages.map((src, index) => (
                    <div
                        key={index}
                        className="relative h-full w-full flex-shrink-0 snap-center"
                    >
                        <Image
                            src={src}
                            alt={`${productName} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {hasMultipleImages && (
                <>
                    <button
                        onClick={prevImage}
                        disabled={activeIndex === 0}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#2D5A27] shadow-sm border border-gray-100 transition-all z-20 ${activeIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
                            }`}
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={nextImage}
                        disabled={activeIndex === displayImages.length - 1}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#2D5A27] shadow-sm border border-gray-100 transition-all z-20 ${activeIndex === displayImages.length - 1 ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
                            }`}
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Indicators */}
            {hasMultipleImages && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {displayImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToImage(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-6 bg-[#2D5A27]" : "w-1.5 bg-white/60"
                                }`}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
