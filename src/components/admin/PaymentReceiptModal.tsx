import { TransactionRecord } from "@/types";
import { Copy, X, Check, Share2, Loader2, Download } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toNepali } from "@/lib/date-helper";
import ShareableBill from "@/components/admin/ShareableBill"; // Fixed import path
import { toPng } from 'html-to-image';

interface PaymentReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: TransactionRecord;
    receivedAmount: number;
}

export default function PaymentReceiptModal({
    isOpen,
    onClose,
    order,
    receivedAmount
}: PaymentReceiptModalProps) {
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Message for text fallback
    const message = `Namaste ${order.partyName},

Thank you for your payment of Rs. ${receivedAmount.toLocaleString()}.

Order No: ${order.billNo}
Date: ${toNepali(new Date(), "DD MMM YYYY")}

We appreciate your business!
Greenbird Homestead`;

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const generateImage = async () => {
        if (!receiptRef.current) return null;
        try {
            // Need to ensure fonts and images are loaded. 
            // The scaling in ShareableBill might need adjustment for the capture if it's hidden or scaled down in modal.
            // For now, we capture what is rendered.
            const dataUrl = await toPng(receiptRef.current, {
                cacheBust: true,
                pixelRatio: 2, // Higher quality
                backgroundColor: '#ffffff',
            });
            return dataUrl;
        } catch (err) {
            console.error("Failed to generate image:", err);
            return null;
        }
    };

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const dataUrl = await generateImage();
            if (!dataUrl) throw new Error("Failed to generate receipt image");

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `Receipt-${order.billNo}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Payment Receipt #${order.billNo}`,
                    text: `Payment Receipt from Greenbird Homestead for ${order.partyName}`
                });
            } else {
                // Fallback to WhatsApp link with text if native sharing shouldn't download (but user asked to share)

                // Trigger download
                const link = document.createElement('a');
                link.download = `Receipt-${order.billNo}.png`;
                link.href = dataUrl;
                link.click();

                // Open WhatsApp with text
                const mobileNumber = order.customerPhone;
                const encodedMessage = encodeURIComponent(message);
                const url = mobileNumber
                    ? `https://wa.me/${mobileNumber}?text=${encodedMessage}`
                    : `https://wa.me/?text=${encodedMessage}`;
                window.open(url, '_blank');
            }
        } catch (err) {
            console.error("Share failed:", err);
            alert("Failed to share receipt. You can download it instead.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const dataUrl = await generateImage();
            if (!dataUrl) throw new Error("Failed to generate receipt image");

            const link = document.createElement('a');
            link.download = `Receipt-${order.billNo}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download receipt.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-green-100 p-2 rounded-lg text-green-700">
                            <Check className="h-5 w-5" />
                        </span>
                        <span>Payment Received</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-6 bg-gray-100 flex justify-center">
                    {/* 
                        We wrap ShareableBill in a container. 
                        We want to capture THIS element.
                        ShareableBill has strict width, so we allow it to scale if needed or scroll.
                    */}
                    <div className="shadow-lg rounded-lg overflow-hidden shrink-0">
                        {/* We can use the same shareable bill component but maybe we want to overlay "PAID" watermark? 
                             The ShareableBill component handles display. We can just reuse it.
                         */}
                        <div ref={receiptRef}>
                            <ShareableBill transaction={order} />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleCopy}
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? "Copied Text" : "Copy Text"}</span>
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex-1 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span>Download</span>
                    </button>

                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                    >
                        {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-5 w-5" />}
                        <span>Share Receipt</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
