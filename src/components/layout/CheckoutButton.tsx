"use client";

import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

export default function CheckoutButton() {
    const items = useCartStore((state) => state.items);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || items.length === 0) return null;

    const itemCount = items.length;

    return (
        <Link
            href="/cart" // Direct to cart for now, as standard flow usually goes Cart -> Checkout
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors animate-in fade-in zoom-in duration-300"
        >
            <ShoppingBag className="h-4 w-4" />
            <span>Checkout ({itemCount})</span>
        </Link>
    );
}
