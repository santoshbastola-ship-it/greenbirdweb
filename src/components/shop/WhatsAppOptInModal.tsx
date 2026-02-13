"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X, MessageCircle } from "lucide-react";
import { Suspense } from 'react';

function WhatsAppModalContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get("orderSuccess") === "true") {
            setIsOpen(true);
        }
    }, [searchParams]);

    const bgColors = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300";

    const handleClose = () => {
        setIsOpen(false);
        // Clear the query param without refresh
        const params = new URLSearchParams(searchParams.toString());
        params.delete("orderSuccess");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleWhatsAppClick = () => {
        // TODO: Replace with ACTUAL Bot Number (Business Account Number)
        // This initiates the "Track my order" message which OPENS the 24h window.
        // Format: 977[NUMBER]
        const BOT_NUMBER = "9779800000000";
        const text = encodeURIComponent("Track my order");
        window.open(`https://wa.me/${BOT_NUMBER}?text=${text}`, '_blank');
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className={bgColors}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-transparent dark:border-gray-800">
                {/* Header */}
                <div className="bg-[#25D366] p-6 text-center relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                        <MessageCircle className="h-8 w-8 text-white" fill="white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Order Placed! 📦</h2>
                    <p className="text-white/90 text-sm font-medium">Thank you for your purchase.</p>
                </div>

                {/* Body */}
                <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Get Instant Updates
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                        To receive order status notifications and delivery updates, please enable WhatsApp alerts.
                    </p>

                    <button
                        onClick={handleWhatsAppClick}
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
                    >
                        <MessageCircle className="h-6 w-6" />
                        <span>Enable WhatsApp Updates</span>
                    </button>

                    <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                        This will open a chat with our automated bot.
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-100/50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleClose}
                        className="text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        No thanks, I'll check the app
                    </button>
                </div>
            </div>
        </div>
    );
}

// Wrap in Suspense because usage of useSearchParams() causes client-side de-opt if not wrapped
export default function WhatsAppOptInModal() {
    return (
        <Suspense fallback={null}>
            <WhatsAppModalContent />
        </Suspense>
    );
}
