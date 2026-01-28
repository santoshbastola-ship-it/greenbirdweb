"use client";

import { toNepali } from "@/lib/date-helper";
import Link from "next/link";
import { Plus, Search, FileText, ArrowUpRight, ArrowDownLeft, ArrowLeft, Loader2, Calendar, User, ShoppingBag, CreditCard, Share2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, TransactionType, OrderStatus, PaymentStatus } from "@/types";
import PaymentStatusDropdown from "@/components/admin/PaymentStatusDropdown";
import OrderPartialPaymentDialog from "@/components/admin/OrderPartialPaymentDialog";
import { toPng } from 'html-to-image';
import ShareableBill from "@/components/admin/ShareableBill";

export default function SalesListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"All" | "Sale" | "Purchase">("All");

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const data = await TransactionService.getAllTransactions();
            setTransactions(data);
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTab = activeTab === "All" || t.type === activeTab;

        // For Sales, only show "Delivered" orders
        const isDeliveredSale = t.type === TransactionType.Sale ? t.status === OrderStatus.Delivered : true;

        return matchesSearch && matchesTab && isDeliveredSale;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales & Purchase</h1>
                        <p className="text-gray-500">Track your farm income and expenses</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/sales/new-purchase"
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg shadow-red-900/10"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Purchase
                    </Link>
                    <Link
                        href="/admin/sales/new"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center shadow-lg shadow-green-900/10"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Sale
                    </Link>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    {(["All", "Sale", "Purchase"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-md font-medium transition-all ${activeTab === tab
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab === "Sale" ? "Sales" : tab === "Purchase" ? "Purchases" : "All"}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, bill, or item..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Transactions List */}
            {loading ? (
                <div className="p-20 flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-green-600" />
                    <p>Loading transactions...</p>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="p-20 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No transactions found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTransactions.map((t) => (
                        <SalesCard key={t.id} transaction={t} onUpdate={loadTransactions} />
                    ))}
                </div>
            )}
        </div>
    );
}

function SalesCard({ transaction, onUpdate }: { transaction: TransactionRecord; onUpdate: () => void }) {
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const billRef = useRef<HTMLDivElement>(null);

    const totalAmount = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - (transaction.discount || 0);
    const finalTotal = totalAmount; // Just renaming for clarity
    const remaining = finalTotal - (transaction.paidAmount || 0);

    const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
        if (newStatus === transaction.paymentStatus) return;

        if (newStatus === PaymentStatus.PartialCash || newStatus === PaymentStatus.PartialOnline) {
            setShowPaymentDialog(true);
            return;
        }

        if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;

        setIsUpdating(true);
        try {
            let payAmount = 0;
            let payments = transaction.payments || [];

            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                payAmount = finalTotal;
                const remainingToPay = finalTotal - (transaction.paidAmount || 0);
                if (remainingToPay > 0) {
                    payments = [...payments, {
                        amount: remainingToPay,
                        date: new Date(),
                        note: `Full Payment - ${newStatus === PaymentStatus.PaidOnline ? "Online" : "Cash"}`
                    }];
                }
            } else if (newStatus === PaymentStatus.Pending) {
                payAmount = 0; // Or leave it? Usually reset.
            }

            await TransactionService.updatePaymentStatus(transaction.id, newStatus, payAmount, payments);
            onUpdate();
        } catch (error) {
            console.error("Error updating payment status:", error);
            alert("Failed to update payment status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        // Small delay to allow render
        setTimeout(async () => {
            if (billRef.current) {
                try {
                    const dataUrl = await toPng(billRef.current, {
                        cacheBust: true,
                        pixelRatio: 2,
                        backgroundColor: '#ffffff'
                    });

                    // Convert Data URL to Blob/File for sharing
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], `Greenbird-Bill-${transaction.billNo}.png`, { type: 'image/png' });

                    if (navigator.share && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: `Bill #${transaction.billNo}`,
                            text: `Bill for ${transaction.partyName}`
                        });
                    } else {
                        // Fallback to download if web share is not supported
                        const link = document.createElement('a');
                        link.download = `Greenbird-Bill-${transaction.billNo}.png`;
                        link.href = dataUrl;
                        link.click();
                    }
                } catch (err) {
                    console.error('Failed to share', err);
                    alert("Failed to share receipt. Please try again.");
                } finally {
                    setIsSharing(false);
                }
            } else {
                setIsSharing(false);
            }
        }, 100);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-gray-900 text-lg">{transaction.billNo}</h3>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${transaction.type === TransactionType.Sale
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {transaction.type === TransactionType.Sale ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownLeft className="h-3 w-3 mr-1" />}
                                    {transaction.type}
                                </span>
                            </div>

                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {toNepali(transaction.date, "DD MMM YYYY")}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-700">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">{transaction.partyName}</span>
                            </div>
                            <div className="flex items-start text-gray-600">
                                <ShoppingBag className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                                <span className="truncate max-w-md">{transaction.items.map(i => `${i.productName} (${i.quantity} ${i.unit})`).join(", ")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                        <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end mb-2 md:mb-0">
                            <div className="text-left md:text-right">
                                <div className="text-2xl font-bold text-gray-900">Rs. {finalTotal.toLocaleString()}</div>
                                {remaining > 0 && (transaction.paidAmount || 0) > 0 && (
                                    <div className="text-sm font-medium text-orange-600">Remaining: Rs. {remaining.toLocaleString()}</div>
                                )}
                            </div>
                            <div className="flex justify-end mt-0 md:mt-1 ml-4 md:ml-0">
                                <PaymentStatusDropdown
                                    currentStatus={transaction.paymentStatus || PaymentStatus.Pending}
                                    onChange={handlePaymentStatusChange}
                                    color={
                                        (transaction.paymentStatus === PaymentStatus.PaidCash || transaction.paymentStatus === PaymentStatus.PaidOnline) ? "green" :
                                            (transaction.paymentStatus === PaymentStatus.PartialCash || transaction.paymentStatus === PaymentStatus.PartialOnline) ? "orange" : "red"
                                    }
                                    disabled={isUpdating}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 w-full md:w-auto">
                            {transaction.type === TransactionType.Sale && (
                                <button
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Share Receipt"
                                >
                                    {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                                </button>
                            )}
                            <Link href={`/admin/sales/view?id=${transaction.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center">
                                View Details
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Element for Snapshot */}
            {isSharing && (
                <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                    <ShareableBill ref={billRef} transaction={transaction} />
                </div>
            )}

            {showPaymentDialog && (
                <OrderPartialPaymentDialog
                    order={transaction}
                    onClose={() => setShowPaymentDialog(false)}
                    onSuccess={onUpdate}
                />
            )}
        </>
    );
}
