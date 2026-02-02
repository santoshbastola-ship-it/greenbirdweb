"use client";

import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";

export default function FloatingCheckoutButton() {
    const items = useCartStore((state) => state.items);
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && items.length > 0) {
            // Delay visibility for smooth animation
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [mounted, items.length]);

    // Don't render on server, if no items, or if on cart page
    if (!mounted || items.length === 0 || pathname === '/cart') return null;

    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <div
                className={`
                    fixed bottom-0 left-0 right-0 z-[9999] 
                    transition-transform duration-300 ease-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                `}
            >
                {/* Gradient overlay for better visibility */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

                {/* Button Container */}
                <div className="relative p-4 pb-safe">
                    <Link
                        href="/cart"
                        className="
                            flex items-center justify-center gap-3
                            w-full py-4 px-6
                            bg-gradient-to-r from-[#2D5A27] to-[#3d7a31]
                            text-white rounded-2xl
                            font-bold text-base
                            shadow-lg shadow-green-900/30
                            active:scale-95
                            transition-all duration-200
                            hover:shadow-xl hover:shadow-green-900/40
                        "
                    >
                        <div className="relative">
                            <ShoppingBag className="h-6 w-6" />
                            {/* Item count badge */}
                            <span className="absolute -top-2 -right-2 h-5 w-5 bg-white text-[#2D5A27] rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                                {itemCount}
                            </span>
                        </div>
                        <span>View Cart & Checkout</span>
                    </Link>
                </div>
            </div >
        </>
    );
}
