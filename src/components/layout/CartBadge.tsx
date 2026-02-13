"use client";

import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";

export default function CartBadge({ className }: { className?: string }) {
    const { user } = useAuth();
    const items = useCartStore((state) => state.items);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !user || items.length === 0) return null;

    return (
        <span className={`absolute h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse ${className || "-top-1 -right-1"}`}>
            {items.length}
        </span>
    );
}
