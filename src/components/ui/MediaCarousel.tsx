"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Calendar } from "lucide-react";
import { FarmActivity } from "@/types/extra";
import { format } from "date-fns";
import Image from "next/image";

interface MediaCarouselProps {
    activities: FarmActivity[];
}

export default function MediaCarousel({ activities }: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const activeActivity = activities[currentIndex];
    const media = activeActivity?.media || [{ url: activeActivity?.imageUrl || '', type: 'image' }];

    // Nested carousel for multiple media within one activity
    const [mediaIndex, setMediaIndex] = useState(0);

    const nextActivity = () => {
        setMediaIndex(0);
        setCurrentIndex((prev) => (prev + 1) % activities.length);
    };

    const prevActivity = () => {
        setMediaIndex(0);
        setCurrentIndex((prev) => (prev - 1 + activities.length) % activities.length);
    };

    const nextMedia = () => {
        setMediaIndex((prev) => (prev + 1) % media.length);
    };

    const prevMedia = () => {
        setMediaIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    useEffect(() => {
        setIsPlaying(false);
    }, [currentIndex, mediaIndex]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (!activeActivity) return null;

    return (
        <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-3xl bg-gray-900 shadow-2xl aspect-[16/9] md:aspect-[21/9]">
            {/* Background Image (Blurred) */}
            {/* Background Image (Blurred) */}
            <div className="absolute inset-0">
                <Image
                    src={media[mediaIndex].url}
                    alt="Background blur"
                    fill
                    className="object-cover blur-2xl opacity-30 scale-110"
                    priority={false}
                />
            </div>

            {/* Media Container */}
            <div className="relative h-full w-full flex items-center justify-center bg-black/40 overflow-hidden">
                {media[mediaIndex].type === 'image' ? (
                    <Image
                        key={`${currentIndex}-${mediaIndex}`}
                        src={media[mediaIndex].url}
                        alt={activeActivity.title}
                        fill
                        className="object-cover animate-fadeIn hover:scale-105 transition-transform duration-1000"
                        sizes="(max-width: 768px) 100vw, 80vw"
                        priority
                    />
                ) : (
                    <div className="relative h-full w-full flex items-center justify-center">
                        <video
                            ref={videoRef}
                            key={`${currentIndex}-${mediaIndex}`}
                            src={media[mediaIndex].url}
                            className="h-full w-full object-cover"
                            onEnded={() => setIsPlaying(false)}
                            onClick={togglePlay}
                            autoPlay
                            muted
                            loop
                        />
                        <button
                            onClick={togglePlay}
                            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/30 scale-90 hover:scale-100 transition-transform duration-300">
                                {isPlaying ? <Pause className="h-8 w-8 text-white fill-white" /> : <Play className="h-8 w-8 text-white fill-white ml-1" />}
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 pointer-events-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold mb-4 tracking-wider uppercase">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(activeActivity.date), "MMMM dd, yyyy")}
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                                {activeActivity.title}
                            </h2>
                            <p className="text-gray-200 text-base md:text-lg line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl drop-shadow-md">
                                {activeActivity.description}
                            </p>
                        </div>

                        {/* Internal Media Navigation */}
                        {media.length > 1 && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={prevMedia}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/20"
                                >
                                    <ChevronLeft className="h-5 w-5 text-white" />
                                </button>
                                <div className="flex gap-1.5">
                                    {media.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${i === mediaIndex ? 'w-6 bg-green-500' : 'w-1.5 bg-white/30'}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={nextMedia}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/20"
                                >
                                    <ChevronRight className="h-5 w-5 text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* External Activity Navigation */}
            <button
                onClick={prevActivity}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all backdrop-blur-md text-white border border-white/10 opacity-0 md:opacity-100 group-hover:left-6"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                onClick={nextActivity}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all backdrop-blur-md text-white border border-white/10 opacity-0 md:opacity-100 group-hover:right-6"
            >
                <ChevronRight className="h-6 w-6" />
            </button>

            {/* Bottom Progress Bars for overall activities */}
            <div className="absolute top-4 left-4 right-4 flex gap-2">
                {activities.map((_, i) => (
                    <div
                        key={i}
                        onClick={() => {
                            setCurrentIndex(i);
                            setMediaIndex(0);
                        }}
                        className={`h-1 flex-1 rounded-full cursor-pointer transition-all ${i === currentIndex ? 'bg-green-500' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(1.05); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>
        </div>
    );
}
