"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const clearCart = useCartStore((state) => state.clearCart);

    useEffect(() => {
        console.error("Cart page error:", error);
    }, [error]);

    const handleReset = () => {
        // Clear cart store to remove potentially corrupted data
        try {
            clearCart();
            // Also explicitly clear localStorage for double safety
            localStorage.removeItem("greenbird-cart");
        } catch (e) {
            console.error("Failed to clear cart during reset", e);
        }
        // Attempt to recover by re-rendering
        reset();
        // Force reload if reset doesn't work (Next.js error boundaries sometimes need a full reload)
        window.location.reload();
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="bg-red-50 p-8 rounded-2xl max-w-md w-full text-center border border-red-100">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-8">
                    We encountered an error while loading your cart. This might be due to corrupted data.
                </p>

                <button
                    onClick={handleReset}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw className="h-5 w-5" />
                    Reset Cart & Reload
                </button>
            </div>
        </div>
    );
}
