"use client";

import { useEffect, useState } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus, TransactionType, PaymentStatus, PaymentRecord, OrderLog, Product, SalesItem, BusinessType } from "@/types";
import { Plus, Check, X, Calendar, Clock, MapPin, User, Search, Filter, Download, ShoppingBag, CreditCard, AlertCircle, Edit2, Save, Trash, RotateCcw, ChevronDown, Package } from "lucide-react";
import { toNepali } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import dynamic from 'next/dynamic';

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";
import PaymentStatusDropdown from "@/components/admin/PaymentStatusDropdown";
import OrderStatusDropdown from "@/components/admin/OrderStatusDropdown";
import OrderPartialPaymentDialog from "@/components/admin/OrderPartialPaymentDialog";
import PaymentReceiptModal from "@/components/admin/PaymentReceiptModal";
import { useAuth } from "@/context/AuthContext";
import { ProductService } from "@/services/product.service";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import LogoLoader from "@/components/ui/LogoLoader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import TransactionDetailsModal from "@/components/admin/TransactionDetailsModal";

type TabStatus = OrderStatus;

export default function AdminOrdersPage() {
    const { dbUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabStatus>(OrderStatus.Open);
    const [orders, setOrders] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await TransactionService.getAllTransactions();
            // Filter only sales (orders)
            const salesOnly = data.filter(t => t.type === TransactionType.Sale);
            setOrders(salesOnly);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Order",
            message: "Are you sure you want to PERMANENTLY delete this order? This action cannot be undone.",
            confirmText: "Yes, Delete Order",
            variant: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    await TransactionService.deleteTransaction(id, dbUser?.name || "Admin");
                    loadOrders();
                } catch (error) {
                    console.error(error);
                    alert("Failed to delete order");
                    setLoading(false);
                }
            }
        });
    };

    const isManager = dbUser?.role === 'manager';

    const filteredOrders = orders.filter(order => {
        const matchesStatus = order.status === activeTab;

        // Manager restrictions: only show undelivered
        if (isManager && (order.status === OrderStatus.Delivered || order.status === OrderStatus.Cancelled)) {
            return false;
        }

        const matchesSearch = searchQuery === "" ||
            order.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.partyName.toLowerCase().includes(searchQuery.toLowerCase());

        const orderDate = new Date(order.date);
        const matchesStartDate = !startDate || orderDate >= new NepaliDate(startDate).toJsDate();
        const matchesEndDate = !endDate || orderDate <= new Date(new NepaliDate(endDate).toJsDate().setHours(23, 59, 59, 999));

        return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => {
        // Special sorting for Delivered status
        if (activeTab === OrderStatus.Delivered) {
            // Sort by updatedAt descending if available, otherwise by date descending (newest first)
            const getUpdatedTime = (o: TransactionRecord) => {
                if (o.updatedAt) {
                    return new Date(o.updatedAt).getTime();
                }
                return new Date(o.date).getTime();
            };
            return getUpdatedTime(b) - getUpdatedTime(a);
        }

        // Sort by expected delivery date if available, otherwise fall back to order date
        // Handling different types of expectedDeliveryDate (string | Date | undefined)
        const getDeiveryTime = (o: TransactionRecord) => {
            if (o.expectedDeliveryDate) {
                return new Date(o.expectedDeliveryDate).getTime();
            }
            return new Date(o.date).getTime() + (24 * 60 * 60 * 1000); // Assume next day if not set
        };
        return getDeiveryTime(a) - getDeiveryTime(b);
    });

    const tabs = [
        { label: "Open", status: OrderStatus.Open, count: orders.filter(o => o.status === OrderStatus.Open).length },
        { label: "Accepted", status: OrderStatus.Accepted, count: orders.filter(o => o.status === OrderStatus.Accepted).length },
        { label: "Delivered", status: OrderStatus.Delivered, count: orders.filter(o => o.status === OrderStatus.Delivered).length },
        { label: "Cancelled", status: OrderStatus.Cancelled, count: orders.filter(o => o.status === OrderStatus.Cancelled).length },
    ].filter(tab => {
        if (isManager && (tab.status === OrderStatus.Delivered || tab.status === OrderStatus.Cancelled)) {
            return false;
        }
        return true;
    });

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    return (
        <div className="space-y-8 pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Order Management</h1>

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
                                key={tab.status}
                                onClick={() => setActiveTab(tab.status)}
                                className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.status
                                    ? "text-green-600 border-b-2 border-green-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.status
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

                {/* Orders List */}
                {loading ? (
                    <div className="text-center py-20">
                        <LogoLoader />
                        <p className="mt-4 text-gray-500">Loading orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} orders</h3>
                        <p className="text-gray-500">Orders with this status will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onSelect={(order) => setSelectedOrderId(order.id)}
                                onDelete={dbUser?.role === 'admin' ? () => handleDelete(order.id) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedOrder && (
                <TransactionDetailsModal
                    transaction={selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdate={loadOrders}
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

function OrderCard({ order, onSelect, onDelete }: { order: TransactionRecord; onSelect: (order: TransactionRecord) => void; onDelete?: () => void }) {
    const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0) - (order.discount || 0) + (order.deliveryFee || 0);
    const remaining = totalAmount - (order.paidAmount || 0);

    const isPaid = order.paymentStatus === PaymentStatus.PaidCash || order.paymentStatus === PaymentStatus.PaidOnline;
    const amountColorClass = isPaid ? "text-green-600" : "text-red-600";

    // Helper to format delivery info
    const deliveryInfo = () => {
        if (!order.expectedDeliveryDate && !order.expectedDeliveryTime) return null;

        const dateStr = typeof order.expectedDeliveryDate === 'string'
            ? order.expectedDeliveryDate
            : order.expectedDeliveryDate instanceof Date
                ? toNepali(order.expectedDeliveryDate, "DD MMM YYYY")
                : "Scheduled";

        return `${dateStr} ${order.expectedDeliveryTime ? `at ${order.expectedDeliveryTime}` : ''}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow relative group">
            <div className="flex items-center justify-between gap-4">
                {/* Left: ID and Date */}
                <div className="min-w-0">
                    <button
                        onClick={() => onSelect(order)}
                        className="font-bold text-gray-900 text-lg hover:text-green-600 hover:underline transition-colors block truncate"
                    >
                        {order.billNo}
                    </button>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {toNepali(order.date, "DD MMM YYYY")}
                    </div>
                </div>

                {/* Middle: Customer and Delivery (Hidden on small mobile) */}
                <div className="hidden sm:block flex-1 px-4">
                    <div className="flex items-center text-gray-900 font-medium text-sm">
                        <User className="h-3 w-3 mr-1 text-gray-400" />
                        {order.partyName}
                    </div>
                    {/* Items Summary */}
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ShoppingBag className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="line-clamp-2">
                            {order.items.map(item => `${item.productName} (${item.quantity} ${item.unit})`).join(", ")}
                        </span>
                    </div>
                    {deliveryInfo() && (
                        <div className="flex items-center text-green-600 text-xs mt-1 font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            {deliveryInfo()}
                        </div>
                    )}
                </div>

                {/* Right: Amount */}
                <div className="text-right whitespace-nowrap flex flex-row items-center gap-2">
                    <div>
                        <div className={`text-lg font-bold ${amountColorClass}`}>Rs. {totalAmount.toLocaleString()}</div>
                        {remaining > 0 && (order.paidAmount || 0) > 0 && (
                            <div className="text-xs font-semibold text-orange-600">
                                Due: {remaining.toLocaleString()}
                            </div>
                        )}
                    </div>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                            title="Delete Order"
                        >
                            <Trash className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            {/* Mobile only details line */}
            <div className="sm:hidden mt-3 pt-3 border-t border-gray-50">
                <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-600 truncate mr-2 font-medium flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {order.partyName}
                    </span>
                    {deliveryInfo() && (
                        <span className="text-green-600 font-medium flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {deliveryInfo()}
                        </span>
                    )}
                </div>
                {/* Mobile Items Summary */}
                <div className="text-xs text-gray-500 flex items-start">
                    <ShoppingBag className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">
                        {order.items.map(item => `${item.productName} (${item.quantity} ${item.unit})`).join(", ")}
                    </span>
                </div>
            </div>
        </div>
    );
}


