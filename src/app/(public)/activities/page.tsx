"use client";

import { useState, useEffect } from "react";
import { FarmActivity } from "@/types/extra";
import { getActivities } from "@/lib/services/activities";
import { format } from "date-fns";
import { Calendar, ArrowLeft, Trees, Sprout } from "lucide-react";
import Link from "next/link";
import LogoLoader from "@/components/ui/LogoLoader";
import SingleActivityCarousel from "@/components/ui/SingleActivityCarousel";
import ShareButton from "@/components/ui/ShareButton";

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<FarmActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await getActivities(50);
                setActivities(data.filter(a => a.isPublished));
            } catch (error) {
                console.error("Failed to fetch activities:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FCF9F1]">
                <LogoLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-32 selection:bg-[#2D5A27] selection:text-white">
            {/* Elegant Header */}
            <div className="relative bg-[#2D5A27] py-40 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center bg-fixed"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#2D5A27]"></div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-1/2 -right-24 w-64 h-64 bg-yellow-200/5 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="inline-flex items-center text-green-200 hover:text-white mb-16 transition-all group font-medium bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 hover:bg-white/10">
                        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="max-w-3xl">
                            <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-md rounded-xl text-green-200 text-[10px] font-bold uppercase tracking-[0.4em] mb-8 border border-white/10">
                                Official Farm Chronicle
                            </span>
                            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                                Capturing <br />
                                <span className="text-green-300 italic serif">Nature's Rythm</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-green-50/70 max-w-2xl leading-relaxed font-light">
                                A curated archive of our journey through the seasons. Each moment is a testament to the beauty of sustainable life and the joy of the harvest.
                            </p>
                        </div>
                        <div className="hidden lg:flex gap-16 text-white/20">
                            <div className="flex flex-col items-center group cursor-default">
                                <div className="p-6 rounded-3xl border border-white/5 group-hover:bg-white/5 transition-colors duration-500">
                                    <Trees className="h-16 w-16 mb-2 opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                                <span className="mt-4 text-[10px] uppercase tracking-[0.3em] font-bold">Nature</span>
                            </div>
                            <div className="flex flex-col items-center group cursor-default">
                                <div className="p-6 rounded-3xl border border-white/5 group-hover:bg-white/5 transition-colors duration-500">
                                    <Sprout className="h-16 w-16 mb-2 opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                                <span className="mt-4 text-[10px] uppercase tracking-[0.3em] font-bold">Growth</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activities Rows */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 z-10">
                {/* Background Pattern for Content area */}
                <div className="absolute inset-x-0 top-64 bottom-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

                {activities.length === 0 ? (
                    <div className="bg-white rounded-[4rem] p-32 text-center shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] border border-gray-100 italic text-gray-300 text-3xl font-light">
                        The chronicles are currently empty. <br /> Check back for fresh harvests soon.
                    </div>
                ) : (
                    <div className="space-y-48 lg:space-y-64 pb-20">
                        {activities.map((activity, index) => {
                            const media = (activity.media && activity.media.length > 0) ? activity.media : (activity.imageUrl ? [{ url: activity.imageUrl, type: 'image' }] : []);

                            return (
                                <div
                                    key={activity.id}
                                    className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 lg:gap-24 items-center`}
                                >
                                    {/* Media Carousel Container */}
                                    <div className="w-full lg:w-[60%] animate-slideUp">
                                        <div className="relative group/container">
                                            {/* Decorative background depth */}
                                            <div className="absolute -inset-4 bg-[#2D5A27]/5 rounded-[3.5rem] blur-2xl group-hover/container:bg-[#2D5A27]/10 transition-colors duration-700" />

                                            <div className="relative aspect-[16/10] md:aspect-[16/9] lg:aspect-[4/3] rounded-[3rem] overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.2)] border-[12px] border-white bg-gray-50 transform hover:scale-[1.01] transition-all duration-700">
                                                <SingleActivityCarousel
                                                    media={media as any}
                                                    title={activity.title}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Container */}
                                    <div className="w-full lg:w-[40%] space-y-10 animate-fadeIn">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-0.5 w-16 bg-[#2D5A27]/30" />
                                                <div className="flex items-center gap-2.5 text-[#2D5A27] font-black text-xs tracking-[0.3em] uppercase">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(activity.date), "MMMM dd, yyyy")}
                                                </div>
                                            </div>

                                            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
                                                {activity.title}
                                            </h2>

                                            <p className="text-xl text-gray-600 leading-relaxed font-light font-serif">
                                                {activity.description}
                                            </p>
                                        </div>

                                        <div className="pt-6 border-t border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex -space-x-4">
                                                        {media.slice(0, 4).map((m, i) => (
                                                            <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white bg-gray-200 overflow-hidden shadow-xl transform transition-transform hover:-translate-y-2 hover:z-10 cursor-pointer">
                                                                <img src={m.url} className="w-full h-full object-cover" alt="" />
                                                            </div>
                                                        ))}
                                                        {media.length > 4 && (
                                                            <div className="w-12 h-12 rounded-2xl border-4 border-white bg-[#2D5A27] flex items-center justify-center text-xs text-white font-black shadow-xl">
                                                                +{media.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Capture count</span>
                                                        <span className="text-sm text-gray-900 font-bold">{media.length} Media Assets</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <ShareButton
                                                        title={activity.title}
                                                        text={`Check out this activity: ${activity.title} at Greenbird Homestead. Nature's rhythm captured!`}
                                                        className=""
                                                    />
                                                    <div className="h-12 w-12 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 hover:text-[#2D5A27] hover:border-[#2D5A27] transition-all cursor-crosshair">
                                                        <Sprout className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
                
                .serif {
                    font-family: 'Playfair Display', serif;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(60px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: rotate(1deg); }
                    to { opacity: 1; transform: rotate(0); }
                }
                .animate-slideUp {
                    animation: slideUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .animate-fadeIn {
                    animation: fadeIn 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
}
