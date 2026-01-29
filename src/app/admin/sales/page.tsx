"use client";

import { useEffect, useState, useRef } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus, TransactionType, PaymentStatus, PaymentRecord, OrderLog, Product, SalesItem, BusinessType, User as UserType } from "@/types";
import { Plus, Check, X, Calendar, Clock, MapPin, User, Search, Filter, Download, ShoppingBag, CreditCard, AlertCircle, Edit2, Save, Trash, RotateCcw, ChevronDown, Package, ArrowUpRight, ArrowDownLeft, Share2, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { toNepali, formatDateTime } from "@/lib/date-helper";
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
import LogoLoader from "@/components/ui/LogoLoader";

type TabType = "All" | "Pending" | TransactionType.Sale | TransactionType.Purchase;

export default function SalesListPage() {
    const [activeTab, setActiveTab] = useState<TabType>("Pending");
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
        let matchesTab = true;
        if (activeTab === "Pending") {
            matchesTab = t.paymentStatus !== PaymentStatus.PaidCash && t.paymentStatus !== PaymentStatus.PaidOnline;
        } else if (activeTab !== "All") {
            matchesTab = t.type === activeTab;
        }

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
        {
            label: "Pending",
            value: "Pending",
            count: transactions.filter(t => t.paymentStatus !== PaymentStatus.PaidCash && t.paymentStatus !== PaymentStatus.PaidOnline).length
        },
        { label: "All", value: "All", count: transactions.length },
        { label: "Sales", value: TransactionType.Sale, count: transactions.filter(t => t.type === TransactionType.Sale).length },
        { label: "Purchases", value: TransactionType.Purchase, count: transactions.filter(t => t.type === TransactionType.Purchase).length },
    ];

    const selectedTransaction = transactions.find(t => t.id === selectedId);

    return (
        <div className="space-y-8 pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sales & Purchase</h1>
                    </div>
                    <div className="flex flex-row gap-3 w-full sm:w-auto">
                        <Link
                            href="/admin/sales/new-purchase"
                            className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2.5 rounded-xl font-bold hover:from-red-700 hover:to-red-600 transition-all flex items-center justify-center shadow-lg shadow-red-900/20 active:scale-95 hover:-translate-y-0.5"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Purchase
                        </Link>
                        <Link
                            href="/admin/sales/new"
                            className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2.5 rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-all flex items-center justify-center shadow-lg shadow-green-900/20 active:scale-95 hover:-translate-y-0.5"
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
                        <LogoLoader />
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
    const totalAmount = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - (transaction.discount || 0);
    const remaining = totalAmount - (transaction.paidAmount || 0);

    const isPaid = transaction.paymentStatus === PaymentStatus.PaidCash || transaction.paymentStatus === PaymentStatus.PaidOnline;
    const amountColorClass = transaction.type === TransactionType.Sale ? "text-green-600" : "text-red-600";



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
                        <div className={`px-2 py-1 rounded-md text-xs font-bold ${(transaction.paymentStatus === PaymentStatus.PaidCash || transaction.paymentStatus === PaymentStatus.PaidOnline) ? "bg-green-100 text-green-700" :
                            (transaction.paymentStatus === PaymentStatus.PartialCash || transaction.paymentStatus === PaymentStatus.PartialOnline) ? "bg-orange-100 text-orange-700" :
                                "bg-red-100 text-red-700"
                            }`}>
                            {transaction.paymentStatus}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1 border-l pl-4">
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
                </div>
                <div className="text-xs text-gray-500 flex items-start">
                    <ShoppingBag className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">
                        {transaction.items.map(item => `${item.productName} (${item.quantity} ${item.unit})`).join(", ")}
                    </span>
                </div>
            </div>
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
    const [isSharing, setIsSharing] = useState(false);
    const billCaptureRef = useRef<HTMLDivElement>(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<TransactionRecord>(JSON.parse(JSON.stringify(transaction)));
    const [products, setProducts] = useState<Product[]>([]);
    const [isProductsLoading, setIsProductsLoading] = useState(false);

    const totalItemsPrice = (isEditing ? editForm.items : transaction.items).reduce((sum, item) => sum + item.totalPrice, 0);
    const finalTotal = totalItemsPrice - (transaction.discount || 0);
    const remainingAmount = finalTotal - (transaction.paidAmount || 0);

    // Initialize products when entering edit mode
    useEffect(() => {
        if (isEditing && products.length === 0) {
            loadProducts();
        }
    }, [isEditing]);

    const loadProducts = async () => {
        setIsProductsLoading(true);
        try {
            const allProducts = await ProductService.getAllProducts();
            setProducts(allProducts.filter(p => p.isAvailableForSale));
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsProductsLoading(false);
        }
    };

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

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            // Short delay to ensure the off-screen component is ready
            await new Promise(resolve => setTimeout(resolve, 300));

            if (!billCaptureRef.current) {
                console.error("Capture ref is null");
                throw new Error("Shareable component not found");
            }

            const dataUrl = await toPng(billCaptureRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });

            if (!dataUrl) throw new Error("Failed to generate image URL");

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `Greenbird-Bill-${transaction.billNo}.png`, { type: 'image/png' });

            // Try to share using native share API
            let shared = false;
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Bill #${transaction.billNo}`,
                        text: `Bill from Greenbird Homestead for ${transaction.partyName}`
                    });
                    shared = true;
                } catch (shareErr: any) {
                    console.warn("Native share failed, falling back to download:", shareErr);
                    // If user cancelled, don't fallback to download unless it was a real error
                    if (shareErr.name === 'AbortError') shared = true;
                }
            }

            // Fallback: Download the file if not shared
            if (!shared) {
                const link = document.createElement('a');
                link.download = `Greenbird-Bill-${transaction.billNo}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to share receipt:', err);
            alert("Could not share receipt. Please check your browser permissions or try downloading manually.");
        } finally {
            setIsSharing(false);
        }
    };


    const handleSaveChanges = async () => {
        if (!confirm("Are you sure you want to save these changes?")) return;

        setIsUpdating(true);
        try {
            const changes: string[] = [];
            if (JSON.stringify(editForm.items) !== JSON.stringify(transaction.items)) {
                changes.push("Items updated");
            }
            if (editForm.partyName !== transaction.partyName) {
                changes.push(`Party Name changed to ${editForm.partyName}`);
            }

            if (changes.length === 0) {
                setIsEditing(false);
                setIsUpdating(false);
                return;
            }

            const newLog: OrderLog = {
                id: Date.now().toString(),
                date: new Date(),
                action: "Transaction Edited",
                details: changes.join(", "),
                changedBy: dbUser?.name || "Admin"
            };

            await TransactionService.updateTransaction(transaction.id, {
                items: editForm.items,
                partyName: editForm.partyName,
                logs: [...(transaction.logs || []), newLog],
            });

            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to update transaction", error);
            alert("Failed to save changes: " + (error as Error).message);
        } finally {
            setIsUpdating(false);
        }
    };

    const updateItem = (index: number, field: keyof SalesItem, value: any) => {
        const newItems = [...editForm.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Handle calculation logic
        const item = newItems[index];
        if (field === 'quantity' || field === 'pricePerUnit' || field === 'weight') {
            if (item.unit === item.priceUnit) {
                newItems[index].totalPrice = (item.quantity || 0) * (item.pricePerUnit || 0);
            } else {
                newItems[index].totalPrice = (item.weight || 0) * (item.pricePerUnit || 0);
            }
        }
        setEditForm({ ...editForm, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = editForm.items.filter((_, i) => i !== index);
        setEditForm({ ...editForm, items: newItems });
    };

    const handleAddItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        if (!productId) return;
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newItem: SalesItem = {
            productId: product.id,
            productName: product.name,
            businessType: product.businessType,
            quantity: 1,
            unit: product.unit,
            priceUnit: product.priceUnit,
            pricePerUnit: product.currentPrice,
            totalPrice: product.currentPrice
        };
        setEditForm({ ...editForm, items: [...editForm.items, newItem] });
        e.target.value = "";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* Hidden Shareable Bill for Capture */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <ShareableBill ref={billCaptureRef} transaction={transaction} />
            </div>

            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{transaction.billNo}</h3>
                            {isEditing && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">EDITING</span>}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${transaction.type === TransactionType.Sale ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {transaction.type.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">{toNepali(transaction.date, "DD MMM YYYY")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {transaction.type === TransactionType.Sale && !isEditing && (
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                                <span className="text-sm font-medium hidden sm:inline">Share</span>
                            </button>
                        )}
                        <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Edit2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Edit</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditForm(JSON.parse(JSON.stringify(transaction)));
                                        setIsEditing(false);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span className="text-sm">Cancel</span>
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    <span className="text-sm font-medium">Save</span>
                                </button>
                            </div>
                        )}
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
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.partyName}
                                        onChange={(e) => setEditForm({ ...editForm, partyName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
                                        placeholder="Party Name"
                                    />
                                ) : (
                                    <p className="font-bold text-gray-900 text-lg">{transaction.partyName}</p>
                                )}
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
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-gray-400" />
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Items</h4>
                            </div>
                            {isEditing && (
                                <div className="relative">
                                    <div className={`flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 ${isProductsLoading ? 'opacity-70 cursor-wait' : 'hover:bg-green-100 cursor-pointer'} text-green-700 transition-colors relative`}>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        <span className="text-xs font-bold whitespace-nowrap">
                                            {isProductsLoading ? "Loading..." : "Add Item"}
                                        </span>
                                        {!isProductsLoading && (
                                            <select
                                                onChange={handleAddItem}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                disabled={isProductsLoading}
                                            >
                                                <option value="">Select product...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (Rs {p.currentPrice})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Desktop Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <div className="col-span-6">Item</div>
                                <div className="col-span-3 text-center">Qty / Price</div>
                                <div className="col-span-3 text-right">Total</div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {isEditing ? (
                                    editForm.items.map((item, idx) => (
                                        <div key={idx} className="p-4 md:px-6 md:py-5 transition-colors hover:bg-gray-50/30">
                                            <div className="flex flex-col gap-4">
                                                {/* Item Header: Name and Unit Label */}
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-bold text-gray-900 text-sm block">{item.productName}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Rate: Rs {item.pricePerUnit} per {item.priceUnit}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Inputs: Quantity and Weight */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex-1 min-w-[120px]">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qty ({item.unit})</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                            placeholder="Quantity"
                                                        />
                                                    </div>

                                                    {item.unit !== item.priceUnit && (
                                                        <div className="flex-1 min-w-[120px]">
                                                            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">{item.priceUnit} (Weight)</label>
                                                            <input
                                                                type="number"
                                                                value={item.weight || 0}
                                                                onChange={(e) => updateItem(idx, 'weight', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-blue-700"
                                                                placeholder="Weight"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-[120px]">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Price / {item.priceUnit}</label>
                                                        <input
                                                            type="number"
                                                            value={item.pricePerUnit}
                                                            onChange={(e) => updateItem(idx, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                            placeholder="Price"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-[100px] text-right ml-auto">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Total</label>
                                                        <span className="font-black text-gray-900">Rs {item.totalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    transaction.items.map((item, idx) => (
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
                                    ))
                                )}
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
                                                <p className="text-xs text-gray-500">
                                                    {toNepali(p.date, "DD MMM YYYY")}
                                                    {p.enteredBy && <span className="hidden sm:inline"> • {p.enteredBy}</span>}
                                                </p>
                                            </div>
                                        </div>
                                        {p.note && <span className="text-xs text-gray-400 italic max-w-[150px] truncate">"{p.note}"</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Order History (Logs) */}
                    {transaction.logs && transaction.logs.length > 0 && (
                        <div className="border-t border-gray-100 pt-4">
                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <span>History Logs ({transaction.logs.length})</span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
                            </button>

                            {showLogs && (
                                <div className="space-y-2 mt-3 pl-1">
                                    {transaction.logs.slice().reverse().map((log) => (
                                        <div key={log.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                            <div className="flex justify-between items-start mb-1 gap-4">
                                                <span className="text-xs font-bold text-gray-700">{log.action}</span>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {formatDateTime(log.date, "DD MMM YYYY")}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 bg-white/50 p-2 rounded border border-gray-100 mt-1">
                                                {log.details}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">by {log.changedBy}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Payment Section - Only show if not editing and not fully paid */}
                    {!isEditing && remainingAmount > 0 && (
                        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-5 w-5 text-green-700" />
                                <h4 className="text-sm font-bold text-green-800">Add Payment</h4>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex items-center gap-4 bg-white/60 p-2 rounded-lg border border-green-100 self-start">
                                    <label className="flex items-center gap-1 cursor-pointer px-2">
                                        <input type="radio" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} className="text-green-600" />
                                        <span className="text-sm font-medium">Cash</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer px-2">
                                        <input type="radio" checked={paymentMethod === 'Online'} onChange={() => setPaymentMethod('Online')} className="text-green-600" />
                                        <span className="text-sm font-medium">Online</span>
                                    </label>
                                </div>

                                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        id="payAmountInput"
                                        className="w-full sm:w-32 px-3 py-2 border border-green-200 rounded-lg text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Note"
                                        id="payNoteInput"
                                        className="flex-1 px-3 py-2 border border-green-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={async () => {
                                            const amountInput = document.getElementById('payAmountInput') as HTMLInputElement;
                                            const noteInput = document.getElementById('payNoteInput') as HTMLInputElement;
                                            const amount = parseFloat(amountInput.value);

                                            if (isNaN(amount) || amount <= 0) {
                                                alert("Invalid amount");
                                                return;
                                            }

                                            const newPaidAmount = (transaction.paidAmount || 0) + amount;
                                            const newPayments = [...(transaction.payments || []), {
                                                amount,
                                                date: new Date(),
                                                note: noteInput.value || `${paymentMethod} Payment`,
                                                enteredBy: dbUser?.name || "Admin"
                                            }];

                                            let newStatus = transaction.paymentStatus;
                                            if (newPaidAmount >= finalTotal) {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PaidOnline : PaymentStatus.PaidCash;
                                            } else {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PartialOnline : PaymentStatus.PartialCash;
                                            }

                                            try {
                                                await TransactionService.updatePaymentStatus(transaction.id, newStatus, newPaidAmount, newPayments);
                                                onUpdate();
                                                amountInput.value = "";
                                                noteInput.value = "";
                                            } catch (error) {
                                                alert("Failed to save payment");
                                            }
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm text-sm"
                                    >
                                        Record Payment
                                    </button>
                                </div>
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

