"use client";

import { useEffect, useState, useRef } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus, TransactionType, PaymentStatus, PaymentRecord, OrderLog, Product, SalesItem, BusinessType, User as UserType } from "@/types";
import { Plus, Check, X, Calendar, Clock, MapPin, User, Search, Filter, Download, ShoppingBag, CreditCard, AlertCircle, Edit2, Save, Trash, RotateCcw, ChevronDown, Package, ArrowUpRight, ArrowDownLeft, Share2, Loader2, ArrowLeft, Trash2, ExternalLink, Paperclip } from "lucide-react";
import { toNepali, formatDateTime } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import dynamic from 'next/dynamic';
import Link from "next/link";
import { toPng } from 'html-to-image';
import ShareableBill from "@/components/admin/ShareableBill";
import PaymentReceiptModal from "@/components/admin/PaymentReceiptModal";
import DocumentUpload from "@/components/admin/DocumentUpload";

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
import ConfirmModal from "@/components/ui/ConfirmModal";
import TransactionDetailsModal from "@/components/admin/TransactionDetailsModal";

type TabType = "All" | "Pending" | TransactionType.Sale | TransactionType.Purchase;

export default function SalesListPage() {
    const { dbUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("Pending");
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        variant: "danger" | "warning" | "info" | "success";
    }>({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "",
        onConfirm: () => { },
        variant: "danger"
    });

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

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Transaction",
            message: "Are you sure you want to PERMANENTLY delete this transaction? This action cannot be undone.",
            confirmText: "Yes, Delete Transaction",
            variant: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    await TransactionService.deleteTransaction(id, dbUser?.name || "Admin");
                    loadTransactions();
                } catch (error) {
                    console.error(error);
                    alert("Failed to delete transaction");
                    setLoading(false);
                }
            }
        });
    };

    const isManager = dbUser?.role === 'manager';

    const filteredTransactions = transactions.filter(t => {
        let matchesTab = true;
        if (activeTab === "Pending") {
            matchesTab = t.paymentStatus !== PaymentStatus.PaidCash && t.paymentStatus !== PaymentStatus.PaidOnline;
        } else if (activeTab !== "All") {
            matchesTab = t.type === activeTab;
        }

        // Show all transactions (removed Delivered-only filter for Sales)
        const isDeliveredSale = true;

        // Manager restrictions: only show pending and undelivered
        if (isManager) {
            const isFinished = (t.paymentStatus === PaymentStatus.PaidCash || t.paymentStatus === PaymentStatus.PaidOnline) &&
                (t.status === OrderStatus.Delivered || t.status === OrderStatus.Cancelled);
            if (isFinished) return false;
        }

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
                    placeholder="Search"
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
                            <TransactionCard
                                key={t.id}
                                transaction={t}
                                onSelect={(tx) => setSelectedId(tx.id)}
                                onUpdate={loadTransactions}
                                onDelete={dbUser?.role === 'admin' ? () => handleDelete(t.id) : undefined}
                            />
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
                    onDelete={handleDelete}
                    setConfirmModal={setConfirmModal}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
            />
        </div>
    );
}

function TransactionCard({ transaction, onSelect, onUpdate, onDelete }: { transaction: TransactionRecord; onSelect: (tx: TransactionRecord) => void; onUpdate: () => void; onDelete?: () => void }) {
    const totalAmount = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - (transaction.discount || 0) + (transaction.deliveryFee || 0);
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
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                title="Delete Transaction"
                            >
                                <Trash2 className="h-4 w-4" />
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

