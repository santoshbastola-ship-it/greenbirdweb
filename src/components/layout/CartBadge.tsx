"use client";

import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";

export default function CartBadge() {
    const { user } = useAuth();
    const items = useCartStore((state) => state.items);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !user || items.length === 0) return null;

    return (
        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
    );
}
