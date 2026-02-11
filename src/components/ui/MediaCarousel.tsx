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
    const [showControls, setShowControls] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const activeActivity = activities[currentIndex];
    const media = activeActivity?.media || [{ url: activeActivity?.imageUrl || '', type: 'image' }];

    // Nested carousel for multiple media within one activity
    const [mediaIndex, setMediaIndex] = useState(0);

    const nextActivity = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMediaIndex(0);
        setCurrentIndex((prev) => (prev + 1) % activities.length);
    };

    const prevActivity = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMediaIndex(0);
        setCurrentIndex((prev) => (prev - 1 + activities.length) % activities.length);
    };

    const nextMedia = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMediaIndex((prev) => (prev + 1) % media.length);
    };

    const prevMedia = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMediaIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    useEffect(() => {
        setIsPlaying(false);
    }, [currentIndex, mediaIndex]);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    if (!activeActivity) return null;

    return (
        <div className="flex flex-col md:block relative w-full max-w-7xl mx-auto overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-2xl md:aspect-[21/10] group">
            {/* Background Image (Blurred) - Desktop Only */}
            <div className="hidden md:block absolute inset-0">
                <Image
                    src={media[mediaIndex].url}
                    alt="Background blur"
                    fill
                    className="object-cover blur-3xl opacity-40 scale-110"
                    priority={false}
                />
            </div>

            {/* Media Container */}
            <div
                className="relative w-full aspect-[4/3] md:aspect-auto md:h-full md:absolute md:inset-0 flex items-center justify-center bg-black/40 overflow-hidden cursor-pointer md:cursor-default"
                onClick={toggleControls}
            >
                {media[mediaIndex].type === 'image' ? (
                    <Image
                        key={`${currentIndex}-${mediaIndex}`}
                        src={media[mediaIndex].url}
                        alt={activeActivity.title}
                        fill
                        className="object-cover md:object-contain animate-fadeIn hover:scale-102 transition-transform duration-1000"
                        sizes="(max-width: 768px) 100vw, 90vw"
                        priority
                    />
                ) : (
                    <div className="relative h-full w-full flex items-center justify-center">
                        <video
                            ref={videoRef}
                            key={`${currentIndex}-${mediaIndex}`}
                            src={media[mediaIndex].url}
                            className="h-full w-full object-cover md:object-contain"
                            onEnded={() => setIsPlaying(false)}
                            onClick={togglePlay}
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                        <button
                            onClick={togglePlay}
                            className={`absolute inset-0 flex items-center justify-center bg-black/20 ${showControls ? 'opacity-100' : 'opacity-0'} md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300`}
                        >
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/30 scale-90 hover:scale-100 transition-transform duration-300">
                                {isPlaying ? <Pause className="h-10 w-10 text-white fill-white" /> : <Play className="h-10 w-10 text-white fill-white ml-1" />}
                            </div>
                        </button>
                    </div>
                )}

                {/* External Activity Navigation (Mobile Overlay) */}
                <button
                    onClick={prevActivity}
                    className={`md:hidden absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 transition-all backdrop-blur-md text-white border border-white/10 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'} duration-300 z-10`}
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                    onClick={nextActivity}
                    className={`md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 transition-all backdrop-blur-md text-white border border-white/10 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'} duration-300 z-10`}
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>

            {/* Content Section */}
            <div className="relative md:absolute inset-0 bg-gray-900 md:bg-transparent md:bg-gradient-to-t md:from-black/95 md:via-black/20 md:to-transparent pointer-events-none">
                <div className="p-6 md:p-12 md:absolute md:bottom-0 md:left-0 md:right-0 pointer-events-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-4xl">
                            <div className="flex items-center gap-3 text-green-400 text-xs md:text-sm font-bold mb-3 md:mb-4 tracking-widest uppercase">
                                <div className="h-px w-6 bg-green-400/50" />
                                <Calendar className="h-4 w-4" />
                                {format(new Date(activeActivity.date), "MMMM dd, yyyy")}
                            </div>
                            <h2 className="text-xl md:text-4xl font-bold text-white mb-3 md:mb-4 md:drop-shadow-2xl leading-tight">
                                {activeActivity.title}
                            </h2>
                            <p className="text-gray-300 md:text-gray-200 text-sm md:text-lg md:line-clamp-3 leading-relaxed max-w-2xl md:drop-shadow-md">
                                {activeActivity.description}
                            </p>
                        </div>

                        {/* Internal Media Navigation */}
                        {media.length > 1 && (
                            <div className="flex items-center gap-4 bg-gray-800 md:bg-black/30 md:backdrop-blur-md p-2 rounded-2xl border border-white/5 md:border-white/10 self-start md:self-auto">
                                <button
                                    onClick={prevMedia}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/20 transition-all border border-white/5"
                                >
                                    <ChevronLeft className="h-6 w-6 text-white" />
                                </button>
                                <div className="flex gap-2">
                                    {media.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-2 rounded-full transition-all duration-500 ${i === mediaIndex ? 'w-8 bg-green-500' : 'w-2 bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={nextMedia}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/20 transition-all border border-white/5"
                                >
                                    <ChevronRight className="h-6 w-6 text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* External Activity Navigation (Desktop) */}
            <button
                onClick={prevActivity}
                className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-black/40 hover:bg-green-600 transition-all backdrop-blur-xl text-white border border-white/10 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 duration-300"
            >
                <ChevronLeft className="h-8 w-8" />
            </button>
            <button
                onClick={nextActivity}
                className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-black/40 hover:bg-green-600 transition-all backdrop-blur-xl text-white border border-white/10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300"
            >
                <ChevronRight className="h-8 w-8" />
            </button>

            {/* Bottom Progress Bars for overall activities */}
            <div className="hidden md:flex absolute top-6 left-8 right-8 gap-3">
                {activities.map((_, i) => (
                    <div
                        key={i}
                        onClick={() => {
                            setCurrentIndex(i);
                            setMediaIndex(0);
                        }}
                        className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-700 ${i === currentIndex ? 'bg-green-500 ring-4 ring-green-500/20' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                ))}
            </div>

            {/* Mobile Dots Indicator */}
            <div className="md:hidden flex justify-center gap-2 pb-6 bg-gray-900 rounded-b-[2.5rem]">
                {activities.map((_, i) => (
                    <div
                        key={i}
                        onClick={() => {
                            setCurrentIndex(i);
                            setMediaIndex(0);
                        }}
                        className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${i === currentIndex ? 'w-8 bg-green-500' : 'w-2 bg-gray-700'}`}
                    />
                ))}
            </div>


            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(1.08); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 1.2s cubic-bezier(0.22, 1, 0.36, 1);
                }
            `}</style>
        </div>
    );
}
