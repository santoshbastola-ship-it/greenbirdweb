"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

interface MediaItem {
    url: string;
    type: 'image' | 'video';
}

interface SingleActivityCarouselProps {
    media: MediaItem[];
    title: string;
}

export default function SingleActivityCarousel({ media, title }: SingleActivityCarouselProps) {
    const [mediaIndex, setMediaIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const nextMedia = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMediaIndex((prev) => (prev + 1) % media.length);
    };

    const prevMedia = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMediaIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    useEffect(() => {
        setIsPlaying(false);
    }, [mediaIndex]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (!media || media.length === 0) return null;

    return (
        <div className="relative w-full h-full group bg-gray-900">
            {media[mediaIndex].type === 'image' ? (
                <div className="relative w-full h-full overflow-hidden">
                    <img
                        src={media[mediaIndex].url}
                        alt={title}
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
            ) : (
                <div className="relative w-full h-full group/video">
                    <video
                        ref={videoRef}
                        src={media[mediaIndex].url}
                        className="w-full h-full object-cover"
                        onEnded={() => setIsPlaying(false)}
                        onClick={togglePlay}
                        muted
                        loop
                        autoPlay
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-colors duration-500" />
                    <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/video:opacity-100 transition-all duration-500"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 scale-90 group-hover/video:scale-100 transition-transform duration-500">
                            {isPlaying ? <Pause className="h-8 w-8 text-white fill-white" /> : <Play className="h-8 w-8 text-white fill-white ml-1" />}
                        </div>
                    </button>
                    <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-[0.2em] border border-white/20">
                        HD Video
                    </div>
                </div>
            )}

            {/* Navigation Arrows */}
            {media.length > 1 && (
                <>
                    <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button
                            onClick={prevMedia}
                            className="p-4 rounded-2xl bg-white/5 hover:bg-white/20 text-white backdrop-blur-xl border border-white/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 -translate-x-0 md:-translate-x-4 md:group-hover:translate-x-0 transition-all duration-500 pointer-events-auto shadow-2xl"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={nextMedia}
                            className="p-4 rounded-2xl bg-white/5 hover:bg-white/20 text-white backdrop-blur-xl border border-white/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-x-0 md:translate-x-4 md:group-hover:translate-x-0 transition-all duration-500 pointer-events-auto shadow-2xl"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Progress Bar Indicators */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {media.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setMediaIndex(i); }}
                                className={`h-1.5 rounded-full transition-all duration-500 bg-white shadow-sm ${i === mediaIndex ? 'w-8 opacity-100' : 'w-2 opacity-40 hover:opacity-60'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
