"use client";

import { useEffect, useState, useRef } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus, TransactionType, PaymentStatus, PaymentRecord, OrderLog, Product, SalesItem, BusinessType, User as UserType } from "@/types";
import { Plus, Check, X, Calendar, Clock, MapPin, User, Search, Filter, Download, ShoppingBag, CreditCard, AlertCircle, Edit2, Save, Trash, RotateCcw, ChevronDown, Package, ArrowUpRight, ArrowDownLeft, Share2, Loader2, ArrowLeft } from "lucide-react";
import { toNepali } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import dynamic from 'next/dynamic';
import Link from "next/link";
import { toPng } from 'html-to-image';
import ShareableBill from "@/components/admin/ShareableBill";

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";
import PaymentStatusDropdown from "@/components/admin/PaymentStatusDropdown";
import OrderStatusDropdown from "@/components/admin/OrderStatusDropdown";
import OrderPartialPaymentDialog from "@/components/admin/OrderPartialPaymentDialog";
import { useAuth } from "@/context/AuthContext";
import { ProductService } from "@/services/product.service";
import AdvancedSearch from "@/components/admin/AdvancedSearch";

type TabType = "All" | TransactionType.Sale | TransactionType.Purchase;

export default function SalesListPage() {
    const [activeTab, setActiveTab] = useState<TabType>("All");
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

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
        const matchesTab = activeTab === "All" || t.type === activeTab;

        // Show all transactions (removed Delivered-only filter for Sales)
        const isDeliveredSale = true;

        const matchesSearch = searchQuery === "" ||
            t.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

        const txDate = new Date(t.date);
        const matchesStartDate = !startDate || txDate >= new NepaliDate(startDate).toJsDate();
        const matchesEndDate = !endDate || txDate <= new Date(new NepaliDate(endDate).toJsDate().setHours(23, 59, 59, 999));

        return matchesTab && isDeliveredSale && matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const tabs: { label: string; value: TabType; count: number }[] = [
        { label: "All", value: "All", count: transactions.length },
        { label: "Sales", value: TransactionType.Sale, count: transactions.filter(t => t.type === TransactionType.Sale).length },
        { label: "Purchases", value: TransactionType.Purchase, count: transactions.filter(t => t.type === TransactionType.Purchase).length },
    ];

    const selectedTransaction = transactions.find(t => t.id === selectedId);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sales & Purchase</h1>
                        <p className="text-gray-500">Track your farm income and expenses</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/admin/sales/new-purchase"
                            className="flex-1 sm:flex-none bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center shadow-lg shadow-red-900/10 active:scale-95"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Purchase
                        </Link>
                        <Link
                            href="/admin/sales/new"
                            className="flex-1 sm:flex-none bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center shadow-lg shadow-green-900/10 active:scale-95"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Sale
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <AdvancedSearch
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                    endDate={endDate}
                    onEndDateChange={setEndDate}
                    placeholder="Search by Bill No, Party, or Item..."
                />

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.label}
                                onClick={() => setActiveTab(tab.value)}
                                className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.value
                                    ? "text-green-600 border-b-2 border-green-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.value
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {tab.count}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transactions List */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-500">Loading transactions...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab === "All" ? "" : activeTab} transactions</h3>
                        <p className="text-gray-500">Records will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTransactions.map((t) => (
                            <TransactionCard key={t.id} transaction={t} onSelect={(tx) => setSelectedId(tx.id)} onUpdate={loadTransactions} />
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedTransaction && (
                <TransactionDetailsModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedId(null)}
                    onUpdate={loadTransactions}
                />
            )}
        </div>
    );
}

function TransactionCard({ transaction, onSelect, onUpdate }: { transaction: TransactionRecord; onSelect: (tx: TransactionRecord) => void; onUpdate: () => void }) {
    const [isSharing, setIsSharing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const billRef = useRef<HTMLDivElement>(null);

    const totalAmount = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - (transaction.discount || 0);
    const remaining = totalAmount - (transaction.paidAmount || 0);

    const isPaid = transaction.paymentStatus === PaymentStatus.PaidCash || transaction.paymentStatus === PaymentStatus.PaidOnline;
    const amountColorClass = transaction.type === TransactionType.Sale ? "text-green-600" : "text-red-600";

    const handleShare = async () => {
        setIsSharing(true);
        setTimeout(async () => {
            if (billRef.current) {
                try {
                    const dataUrl = await toPng(billRef.current, {
                        cacheBust: true,
                        pixelRatio: 2,
                        backgroundColor: '#ffffff'
                    });
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], `Greenbird-Bill-${transaction.billNo}.png`, { type: 'image/png' });

                    if (navigator.share && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: `Bill #${transaction.billNo}`, text: `Bill for ${transaction.partyName}` });
                    } else {
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

    const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
        if (newStatus === transaction.paymentStatus) return;
        if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;

        setIsUpdating(true);
        try {
            let payAmount = 0;
            let payments = transaction.payments || [];

            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                payAmount = totalAmount;
                const remainingToPay = totalAmount - (transaction.paidAmount || 0);
                if (remainingToPay > 0) {
                    payments = [...payments, {
                        amount: remainingToPay,
                        date: new Date(),
                        note: `Full Payment - ${newStatus === PaymentStatus.PaidOnline ? "Online" : "Cash"}`
                    }];
                }
            } else if (newStatus === PaymentStatus.Pending) {
                payAmount = 0;
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-4">
                {/* Left: ID and Date */}
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onSelect(transaction)}
                            className="font-bold text-gray-900 text-lg hover:text-green-600 hover:underline transition-colors block truncate"
                        >
                            {transaction.billNo}
                        </button>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${transaction.type === TransactionType.Sale
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {transaction.type === TransactionType.Sale ? <ArrowUpRight className="h-2 w-2 mr-0.5" /> : <ArrowDownLeft className="h-2 w-2 mr-0.5" />}
                            {transaction.type.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {toNepali(transaction.date, "DD MMM YYYY")}
                    </div>
                </div>

                {/* Middle: Party and Items (Hidden on small mobile) */}
                <div className="hidden sm:block flex-1 px-4">
                    <div className="flex items-center text-gray-900 font-medium text-sm">
                        <User className="h-3 w-3 mr-1 text-gray-400" />
                        {transaction.partyName}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ShoppingBag className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="line-clamp-1">
                            {transaction.items.map(item => `${item.productName} (${item.quantity} ${item.unit})`).join(", ")}
                        </span>
                    </div>
                </div>

                {/* Right: Amount and Actions */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right whitespace-nowrap">
                        <div className={`text-lg font-bold ${amountColorClass}`}>Rs. {totalAmount.toLocaleString()}</div>
                        {remaining > 0 && (transaction.paidAmount || 0) > 0 && (
                            <div className="text-[10px] font-bold text-orange-600">
                                Due: {remaining.toLocaleString()}
                            </div>
                        )}
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

                    <div className="hidden md:flex items-center gap-1 border-l pl-4">
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
                    </div>
                </div>
            </div>
            {/* Mobile only details line */}
            <div className="sm:hidden mt-3 pt-3 border-t border-gray-50">
                <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-600 truncate mr-2 font-medium flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {transaction.partyName}
                    </span>
                    {transaction.type === TransactionType.Sale && (
                        <button onClick={handleShare} disabled={isSharing} className="text-blue-600 font-bold flex items-center gap-1">
                            <Share2 className="h-3 w-3" /> Share
                        </button>
                    )}
                </div>
                <div className="text-xs text-gray-500 flex items-start">
                    <ShoppingBag className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">
                        {transaction.items.map(item => `${item.productName} (${item.quantity} ${item.unit})`).join(", ")}
                    </span>
                </div>
            </div>

            {/* Hidden Element for Snapshot */}
            {isSharing && (
                <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                    <ShareableBill ref={billRef} transaction={transaction} />
                </div>
            )}
        </div>
    );
}

function TransactionDetailsModal({
    transaction,
    onClose,
    onUpdate
}: {
    transaction: TransactionRecord;
    onClose: () => void;
    onUpdate: () => void;
}) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
    const { dbUser } = useAuth();
    const [showLogs, setShowLogs] = useState(false);

    const totalItemsPrice = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const finalTotal = totalItemsPrice - (transaction.discount || 0);
    const remainingAmount = finalTotal - (transaction.paidAmount || 0);

    const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
        if (newStatus === transaction.status) return;
        setIsUpdating(true);
        try {
            await TransactionService.updateTransactionStatus(transaction.id, newStatus, reason);
            onUpdate();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
        if (newStatus === transaction.paymentStatus) return;

        if (newStatus === PaymentStatus.PartialCash || newStatus === PaymentStatus.PartialOnline) {
            setShowPaymentDialog(true);
            return;
        }

        setIsUpdating(true);
        try {
            let payAmount = 0;
            let payments = transaction.payments || [];

            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                payAmount = finalTotal;
                const remaining = finalTotal - (transaction.paidAmount || 0);
                if (remaining > 0) {
                    payments = [...payments, {
                        amount: remaining,
                        date: new Date(),
                        note: `Full Payment - ${newStatus === PaymentStatus.PaidOnline ? "Online" : "Cash"}`
                    }];
                }
            } else if (newStatus === PaymentStatus.Pending) {
                payAmount = 0;
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{transaction.billNo}</h3>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${transaction.type === TransactionType.Sale ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {transaction.type.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">{toNepali(transaction.date, "DD MMM YYYY")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.print()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors">
                            <Download className="h-4 w-4" />
                            <span className="text-sm font-medium">Export</span>
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Party Info */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-5 w-5 text-gray-400" />
                                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{transaction.type === TransactionType.Sale ? 'Customer' : 'Vendor'}</h4>
                            </div>
                            <div className="space-y-1 pl-1">
                                <p className="font-bold text-gray-900 text-lg">{transaction.partyName}</p>
                                {transaction.customerPhone && <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-gray-400"></span> {transaction.customerPhone}
                                </p>}
                                {transaction.deliveryAddress && <p className="text-sm text-gray-600 mt-2">{transaction.deliveryAddress}</p>}
                                <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">Entered By: {transaction.enteredBy}</p>
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Status & Payment</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Payment Status</label>
                                    <PaymentStatusDropdown
                                        currentStatus={transaction.paymentStatus || PaymentStatus.Pending}
                                        onChange={handlePaymentStatusChange}
                                        color={
                                            (transaction.paymentStatus === PaymentStatus.PaidCash || transaction.paymentStatus === PaymentStatus.PaidOnline) ? "green" :
                                                (transaction.paymentStatus === PaymentStatus.PartialCash || transaction.paymentStatus === PaymentStatus.PartialOnline) ? "orange" : "red"
                                        }
                                    />
                                </div>
                                {transaction.type === TransactionType.Sale && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Delivery Status</label>
                                        <OrderStatusDropdown
                                            currentStatus={transaction.status}
                                            onStatusChange={handleStatusChange}
                                            isUpdating={isUpdating}
                                            onCancelClick={() => setShowCancelDialog(true)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Items</h4>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Desktop Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <div className="col-span-6">Item</div>
                                <div className="col-span-3 text-center">Qty / Price</div>
                                <div className="col-span-3 text-right">Total</div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {transaction.items.map((item, idx) => (
                                    <div key={idx} className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center hover:bg-gray-50/50 transition-colors">
                                        <div className="w-full md:col-span-6 font-medium text-gray-700 flex justify-between md:block">
                                            <span>{item.productName}</span>
                                            <span className="md:hidden text-gray-900 font-semibold">Rs. {item.totalPrice.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full md:col-span-3 text-sm text-gray-500 text-left md:text-center flex justify-between md:block">
                                            <span className="md:hidden text-xs uppercase font-medium text-gray-400">Rate</span>
                                            <span>{item.quantity} {item.unit} x {item.pricePerUnit}</span>
                                        </div>
                                        <div className="hidden md:block col-span-3 text-right font-semibold text-gray-900">
                                            Rs. {item.totalPrice.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 border-t border-gray-200 p-4 md:px-8">
                                <div className="flex flex-col gap-2 max-w-xs ml-auto">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">Rs. {totalItemsPrice.toLocaleString()}</span>
                                    </div>
                                    {transaction.discount > 0 && (
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>Discount</span>
                                            <span>- Rs. {transaction.discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                                        <span>Total</span>
                                        <span className={transaction.type === TransactionType.Sale ? "text-green-700" : "text-red-700"}>Rs. {finalTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 pt-1">
                                        <span>Paid</span>
                                        <span className="font-medium text-gray-900">Rs. {transaction.paidAmount?.toLocaleString() || "0"}</span>
                                    </div>
                                    {remainingAmount > 0 && (
                                        <div className="flex justify-between text-sm font-bold text-orange-600 pt-1 border-t border-dashed border-gray-200">
                                            <span>Remaining</span>
                                            <span>Rs. {remainingAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {transaction.payments && transaction.payments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment History</h4>
                            <div className="space-y-2">
                                {transaction.payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                <CreditCard className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">{toNepali(p.date, "DD MMM YYYY")}</p>
                                            </div>
                                        </div>
                                        {p.note && <span className="text-xs text-gray-400 italic max-w-[150px] truncate">"{p.note}"</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCancelDialog && (
                <CancelDialog
                    transaction={transaction}
                    onClose={() => setShowCancelDialog(false)}
                    onConfirm={(reason) => {
                        handleStatusChange(OrderStatus.Cancelled, reason);
                        setShowCancelDialog(false);
                    }}
                />
            )}
            {showPaymentDialog && (
                <OrderPartialPaymentDialog
                    order={transaction}
                    onClose={() => setShowPaymentDialog(false)}
                    onSuccess={onUpdate}
                />
            )}
        </div>
    );
}

function CancelDialog({
    transaction,
    onClose,
    onConfirm,
}: {
    transaction: TransactionRecord;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) {
            alert("Cancellation reason is required");
            return;
        }
        onConfirm(reason.trim());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Transaction</h3>
                <p className="text-gray-600 mb-4">
                    Are you sure you want to cancel <span className="font-semibold">{transaction.billNo}</span>?
                </p>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                        rows={3}
                        placeholder="Enter reason for cancellation..."
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Back</button>
                    <button onClick={handleConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Confirm Cancel</button>
                </div>
            </div>
        </div>
    );
}

