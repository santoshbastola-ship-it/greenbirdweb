"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function OrderSuccessMessageContent() {
    const searchParams = useSearchParams();
    const orderSuccess = searchParams.get('orderSuccess') === 'true';

    if (!orderSuccess) return null;

    return (
        <div className="mb-8 bg-[#2D5A27]/10 dark:bg-green-900/20 border border-[#2D5A27]/20 dark:border-green-500/20 text-[#2D5A27] dark:text-green-400 rounded-2xl p-6 flex justify-between items-center shadow-sm">
            <div>
                <span className="font-bold text-lg">Order Placed Successfully!</span>
                <p className="text-gray-700 dark:text-gray-300 mt-1">You can view your order status in <Link href="/orders" className="underline font-semibold text-[#2D5A27] dark:text-green-400">My Orders</Link>.</p>
            </div>
            <Link href="/orders" className="bg-[#2D5A27] dark:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1f3e1b] dark:hover:bg-green-700 transition-colors">
                View Status
            </Link>
        </div>
    );
}

export default function OrderSuccessMessage() {
    return (
        <Suspense fallback={null}>
            <OrderSuccessMessageContent />
        </Suspense>
    );
}
