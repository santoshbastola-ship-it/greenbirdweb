"use client";

import Link from "next/link";
import { Check, MessageCircle, ArrowRight } from "lucide-react";

export default function OrderSuccessPage() {
    const handleWhatsAppClick = () => {
        // TODO: Replace with ACTUAL Bot Number (Business Account Number)
        // This initiates the "Track my order" message which OPENS the 24h window.
        // Format: 977[NUMBER]
        const BOT_NUMBER = "9779800000000";
        const text = encodeURIComponent("Track my order");
        window.open(`https://wa.me/${BOT_NUMBER}?text=${text}`, '_blank');
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Check className="h-12 w-12 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placed!</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Your order has been recorded successfully. <br />
                    <span className="text-sm">We will process it shortly.</span>
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleWhatsAppClick}
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
                    >
                        <MessageCircle className="h-6 w-6" />
                        <span>Enable WhatsApp Updates</span>
                    </button>

                    <Link
                        href="/shop"
                        className="block w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 group"
                    >
                        <span>Continue Shopping</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <p className="mt-6 text-xs text-gray-400">
                    You can also track your order in the "My Orders" section.
                </p>
            </div>
        </div>
    );
}
