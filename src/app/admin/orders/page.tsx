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
import { useAuth } from "@/context/AuthContext";
import { ProductService } from "@/services/product.service";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import LogoLoader from "@/components/ui/LogoLoader";

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
        if (!confirm("Are you sure you want to PERMANENTLY delete this order?")) return;
        setLoading(true);
        try {
            await TransactionService.deleteTransaction(id);
            loadOrders();
        } catch (error) {
            console.error(error);
            alert("Failed to delete order");
            setLoading(false);
        }
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
                    placeholder="Search by Bill No or Party Name..."
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
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdate={loadOrders}
                />
            )}
        </div>
    );
}

function OrderCard({ order, onSelect, onDelete }: { order: TransactionRecord; onSelect: (order: TransactionRecord) => void; onDelete?: () => void }) {
    const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0) - (order.discount || 0);
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

function CancelDialog({
    order,
    onClose,
    onConfirm,
}: {
    order: TransactionRecord;
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
                <p className="text-gray-600 mb-4">
                    Are you sure you want to cancel order <span className="font-semibold">{order.billNo}</span>?
                </p>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        rows={3}
                        placeholder="Enter reason for cancellation..."
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                        Confirm Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
function OrderDetailsModal({
    order,
    onClose,
    onUpdate
}: {
    order: TransactionRecord;
    onClose: () => void;
    onUpdate: () => void;
}) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
    const { dbUser } = useAuth();
    const isManager = dbUser?.role === 'manager';

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<TransactionRecord>(JSON.parse(JSON.stringify(order)));
    const [products, setProducts] = useState<Product[]>([]);
    const [isProductsLoading, setIsProductsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const totalItemsPrice = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const finalTotal = totalItemsPrice - (order.discount || 0);
    const remainingAmount = finalTotal - (order.paidAmount || 0);

    // Initialize edit form when opening modal or switching to edit mode
    useEffect(() => {
        if (isEditing && products.length === 0) {
            loadProducts();
        }
    }, [isEditing]);

    const loadProducts = async () => {
        setIsProductsLoading(true);
        try {
            const allProducts = await ProductService.getAllProducts();
            // Filter only available products for adding new items
            setProducts(allProducts.filter(p => p.isAvailableForSale));
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsProductsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
        if (newStatus === order.status) return;

        setIsUpdating(true);
        try {
            await TransactionService.updateTransactionStatus(order.id, newStatus, reason);
            onUpdate();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update order status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
        if (newStatus === order.paymentStatus) return;

        if (newStatus === PaymentStatus.PartialCash || newStatus === PaymentStatus.PartialOnline) {
            setShowPaymentDialog(true);
            return;
        }

        setIsUpdating(true);
        try {
            const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0) - (order.discount || 0);
            let payAmount = 0;
            let payments = order.payments || [];

            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                payAmount = totalAmount;
                const remaining = totalAmount - (order.paidAmount || 0);
                if (remaining > 0) {
                    payments = [...payments, {
                        amount: remaining,
                        date: new Date(),
                        note: `Full Payment - ${newStatus === PaymentStatus.PaidOnline ? "Online" : "Cash"}`
                    }];
                }
            } else if (newStatus === PaymentStatus.Pending) {
                payAmount = 0; // Reset paid amount if marked as pending
            }

            await TransactionService.updatePaymentStatus(order.id, newStatus, payAmount, payments);
            onUpdate();
        } catch (error) {
            console.error("Error updating payment status:", error);
            alert("Failed to update payment status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this order?")) return;
        setIsUpdating(true);
        try {
            await TransactionService.deleteTransaction(order.id);
            onClose();
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to delete order");
            setIsUpdating(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!confirm("Are you sure you want to save these changes?")) return;

        setIsUpdating(true);
        try {
            // Calculate changes for log
            const changes: string[] = [];

            if (editForm.deliveryAddress !== order.deliveryAddress) {
                changes.push(`Address changed to '${editForm.deliveryAddress}'`);
            }
            if (editForm.deliveryInstructions !== order.deliveryInstructions) {
                changes.push(`Delivery Note changed`);
            }
            // Simple check for date/time changes
            if (editForm.expectedDeliveryDate !== order.expectedDeliveryDate || editForm.expectedDeliveryTime !== order.expectedDeliveryTime) {
                changes.push(`Delivery Schedule updated`);
            }

            // Check items
            if (JSON.stringify(editForm.items) !== JSON.stringify(order.items)) {
                changes.push("Order Items updated");
            }

            if (changes.length === 0) {
                setIsEditing(false);
                setIsUpdating(false);
                return;
            }

            const newLog: OrderLog = {
                id: Date.now().toString(),
                date: new Date(),
                action: "Order Edited",
                details: changes.join(", "),
                changedBy: dbUser?.name || "Admin"
            };

            const updatedLogs = [...(order.logs || []), newLog];

            await TransactionService.updateTransaction(order.id, {
                deliveryAddress: editForm.deliveryAddress,
                deliveryInstructions: editForm.deliveryInstructions,
                expectedDeliveryDate: editForm.expectedDeliveryDate,
                expectedDeliveryTime: editForm.expectedDeliveryTime,
                items: editForm.items,
                logs: updatedLogs,
            });

            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to update order", error);
            alert("Failed to save changes: " + (error as Error).message);
        } finally {
            setIsUpdating(false);
        }
    };

    const updateItem = (index: number, field: keyof SalesItem, value: any) => {
        const newItems = [...editForm.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate total for item
        if (field === 'quantity' || field === 'pricePerUnit') {
            newItems[index].totalPrice = newItems[index].quantity * newItems[index].pricePerUnit;
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

        // Reset select
        e.target.value = "";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{order.billNo}</h3>
                            {isEditing && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">EDITING</span>}
                        </div>
                        <p className="text-xs text-gray-500">{toNepali(order.date, "DD MMM YYYY")} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            !isManager && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">Edit Order</span>
                                </button>
                            )
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditForm(JSON.parse(JSON.stringify(order)));
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
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                                >
                                    <Save className="h-4 w-4" />
                                    <span className="text-sm font-medium">Save Changes</span>
                                </button>
                            </div>
                        )}
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        {dbUser?.role === "admin" && !isEditing && (
                            <button
                                onClick={handleDelete}
                                disabled={isUpdating}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Order"
                            >
                                <Trash className="h-5 w-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Delivery & Basic Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Delivery */}
                        <div className={`rounded-xl p-5 border transition-colors ${isEditing ? 'bg-white border-blue-200 shadow-sm' : 'bg-blue-50/50 border-blue-100'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className={`h-5 w-5 ${isEditing ? 'text-blue-600' : 'text-blue-500'}`} />
                                <h4 className={`text-sm font-bold uppercase tracking-wide ${isEditing ? 'text-blue-700' : 'text-blue-600'}`}>Delivery Details</h4>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Address</label>
                                    {isEditing ? (
                                        <textarea
                                            value={editForm.deliveryAddress || ''}
                                            onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                                            rows={2}
                                            placeholder="Enter delivery address..."
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-gray-900 leading-relaxed bg-white/50 p-3 rounded-lg border border-transparent">
                                            {order.deliveryAddress || <span className="text-gray-400 italic font-normal">No address provided</span>}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Date</label>
                                        {isEditing ? (
                                            <div className="nepali-datepicker-container">
                                                <NepaliDatePicker
                                                    value={typeof editForm.expectedDeliveryDate === 'string' ? editForm.expectedDeliveryDate : ''}
                                                    onChange={(date: string) => setEditForm({ ...editForm, expectedDeliveryDate: date })}
                                                    options={{ calenderLocale: "en", valueLocale: "en" }}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-gray-900 bg-white/50 p-2.5 rounded-lg">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span>
                                                    {typeof order.expectedDeliveryDate === 'string'
                                                        ? order.expectedDeliveryDate
                                                        : order.expectedDeliveryDate instanceof Date
                                                            ? toNepali(order.expectedDeliveryDate, "DD MMM YYYY")
                                                            : "N/A"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Time</label>
                                        {isEditing ? (
                                            <input
                                                type="time"
                                                value={editForm.expectedDeliveryTime || ''}
                                                onChange={(e) => setEditForm({ ...editForm, expectedDeliveryTime: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-gray-900 bg-white/50 p-2.5 rounded-lg">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span>{order.expectedDeliveryTime || "Anytime"}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Delivery Note</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.deliveryInstructions || ''}
                                            onChange={(e) => setEditForm({ ...editForm, deliveryInstructions: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                                            placeholder="Specific instructions..."
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-600 italic bg-white/50 p-3 rounded-lg">"{order.deliveryInstructions || 'None'}"</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Customer & Status */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Customer</h4>
                                </div>
                                <div className="space-y-1 pl-1">
                                    <p className="font-bold text-gray-900 text-lg">{order.partyName}</p>
                                    {order.customerPhone && <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-gray-400"></span> {order.customerPhone}
                                    </p>}
                                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">Sold By: {order.soldBy}</p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Order Status</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Current Status</label>
                                        <OrderStatusDropdown
                                            currentStatus={order.status}
                                            onStatusChange={handleStatusChange}
                                            isUpdating={isUpdating}
                                            onCancelClick={() => setShowCancelDialog(true)}
                                            disabled={isManager}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Payment</label>
                                        <PaymentStatusDropdown
                                            currentStatus={order.paymentStatus || PaymentStatus.Pending}
                                            onChange={handlePaymentStatusChange}
                                            color={
                                                (order.paymentStatus === PaymentStatus.PaidCash || order.paymentStatus === PaymentStatus.PaidOnline) ? "green" :
                                                    (order.paymentStatus === PaymentStatus.PartialCash || order.paymentStatus === PaymentStatus.PartialOnline) ? "orange" : "red"
                                            }
                                            disabled={isManager}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-gray-400" />
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Order Items</h4>
                            </div>
                            {isEditing && (
                                <div className="relative">
                                    <div className={`flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 ${isProductsLoading ? 'opacity-70 cursor-wait' : 'hover:bg-green-100 cursor-pointer'} text-green-700 transition-colors relative`}>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        <span className="text-xs font-bold whitespace-nowrap">
                                            {isProductsLoading ? "Loading Products..." : "Add Product"}
                                        </span>
                                        {!isProductsLoading && (
                                            <select
                                                onChange={handleAddItem}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                title="Add Product"
                                                disabled={isProductsLoading}
                                            >
                                                <option value="">Select product...</option>
                                                {products.length > 0 ? (
                                                    products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.currentPrice}/{p.unit})</option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>No products available</option>
                                                )}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table / Mobile Cards */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Desktop Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <div className="col-span-5">Item</div>
                                <div className="col-span-3 text-center">Qty / Price</div>
                                <div className="col-span-3 text-right">Total</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {isEditing ? (
                                    editForm.items.map((item, idx) => (
                                        <div key={idx} className="p-4 md:px-6 md:py-4 transition-colors hover:bg-gray-50/30">
                                            <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center">
                                                {/* Product Info */}
                                                <div className="w-full md:col-span-5 flex justify-between md:block">
                                                    <div>
                                                        <span className="font-medium text-gray-900 block">{item.productName}</span>
                                                        <span className="text-xs text-gray-400">{item.unit}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(idx)}
                                                        className="md:hidden p-2 text-red-500 bg-red-50 rounded-lg"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Inputs */}
                                                <div className="w-full md:col-span-3 flex items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="number"
                                                            min="0.1"
                                                            step="0.1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-center focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                                            placeholder="Qty"
                                                        />
                                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none hidden sm:block">x</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.pricePerUnit}
                                                            onChange={(e) => updateItem(idx, 'pricePerUnit', parseFloat(e.target.value))}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-center focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                                            placeholder="Price"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Total */}
                                                <div className="w-full md:col-span-3 flex justify-between md:justify-end items-center md:text-right">
                                                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase">Subtotal</span>
                                                    <span className="font-bold text-gray-900">Rs. {item.totalPrice.toLocaleString()}</span>
                                                </div>

                                                {/* Remove (Desktop) */}
                                                <div className="hidden md:flex col-span-1 justify-end">
                                                    <button
                                                        onClick={() => removeItem(idx)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Remove item"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    order.items.map((item, idx) => (
                                        <div key={idx} className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center hover:bg-gray-50/50">
                                            <div className="w-full md:col-span-5 font-medium text-gray-700 flex justify-between md:block">
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

                            {/* Footer / Totals */}
                            <div className="bg-gray-50 border-t border-gray-200 p-4 md:px-8">
                                <div className="flex flex-col gap-2 max-w-xs ml-auto">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">Rs. {(isEditing ? editForm.items.reduce((s, i) => s + i.totalPrice, 0) : totalItemsPrice).toLocaleString()}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>Discount</span>
                                            <span>- Rs. {order.discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                                        <span>Grand Total</span>
                                        <span className="text-green-700">Rs. {((isEditing ? editForm.items.reduce((s, i) => s + i.totalPrice, 0) : totalItemsPrice) - (order.discount || 0)).toLocaleString()}</span>
                                    </div>

                                    {/* Paid and Due Amount Display */}
                                    <div className="flex justify-between text-sm text-gray-600 pt-1">
                                        <span>Paid Amount</span>
                                        <span className="font-medium text-gray-900">Rs. {order.paidAmount?.toLocaleString() || "0"}</span>
                                    </div>

                                    {((isEditing ? editForm.items.reduce((s, i) => s + i.totalPrice, 0) : totalItemsPrice) - (order.discount || 0) - (order.paidAmount || 0)) > 0 && (
                                        <div className="flex justify-between text-sm font-bold text-orange-600 pt-1 border-t border-dashed border-gray-200">
                                            <span>Due Amount</span>
                                            <span>Rs. {((isEditing ? editForm.items.reduce((s, i) => s + i.totalPrice, 0) : totalItemsPrice) - (order.discount || 0) - (order.paidAmount || 0)).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {order.payments && order.payments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment History</h4>
                            <div className="space-y-2">
                                {order.payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                <CreditCard className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">
                                                    {toNepali(p.date, "DD MMM YYYY")}
                                                    {p.enteredBy && <span className="hidden sm:inline"> • by {p.enteredBy}</span>}
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
                    {order.logs && order.logs.length > 0 && (
                        <div className="border-t border-gray-100 pt-4">
                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <span>Order Logs ({order.logs.length})</span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
                            </button>

                            {showLogs && (
                                <div className="space-y-2 mt-3 pl-1">
                                    {order.logs.slice().reverse().map((log) => (
                                        <div key={log.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                            <div className="flex justify-between items-start mb-1 gap-4">
                                                <span className="text-xs font-bold text-gray-700 break-words">{log.action}</span>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {toNepali(log.date, "DD MMM YYYY")} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 break-words leading-relaxed">{log.details}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">by {log.changedBy}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {order.status === OrderStatus.Cancelled && order.cancellationReason && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Cancellation Reason</h4>
                            <p className="text-sm text-red-700 italic">{order.cancellationReason}</p>
                        </div>
                    )}

                    {/* Add Payment Section - Only show if not editing and NOT a manager */}
                    {!isEditing && !isManager && order.paymentStatus !== PaymentStatus.PaidCash && order.paymentStatus !== PaymentStatus.PaidOnline && (
                        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-5 w-5 text-green-700" />
                                <h4 className="text-sm font-bold text-green-800">Add Payment</h4>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Payment Method Selection */}
                                <div className="flex items-center gap-4 bg-white/60 p-2 rounded-lg border border-green-100 self-start">
                                    <label className="flex items-center gap-2 cursor-pointer px-2">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'Cash'}
                                            onChange={() => setPaymentMethod('Cash')}
                                            className="text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Cash</span>
                                    </label>
                                    <div className="w-px h-4 bg-green-200"></div>
                                    <label className="flex items-center gap-2 cursor-pointer px-2">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'Online'}
                                            onChange={() => setPaymentMethod('Online')}
                                            className="text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Online</span>
                                    </label>
                                </div>

                                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        id="paymentAmount"
                                        className="w-full sm:w-32 px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Note (optional)"
                                        id="paymentNote"
                                        className="flex-1 px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                    />
                                    <button
                                        onClick={async () => {
                                            const amountInput = document.getElementById('paymentAmount') as HTMLInputElement;
                                            const noteInput = document.getElementById('paymentNote') as HTMLInputElement;
                                            const amount = parseFloat(amountInput.value);

                                            if (isNaN(amount) || amount <= 0) {
                                                alert("Please enter a valid amount");
                                                return;
                                            }

                                            const newPaidAmount = (order.paidAmount || 0) + amount;
                                            const newPayments = [...(order.payments || []), {
                                                amount,
                                                date: new Date(),
                                                note: noteInput.value || `${paymentMethod} Payment`,
                                                enteredBy: dbUser?.name || "Admin"
                                            }];

                                            let newStatus = order.paymentStatus;
                                            if (newPaidAmount >= finalTotal) {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PaidOnline : PaymentStatus.PaidCash;
                                            } else if (newPaidAmount > 0) {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PartialOnline : PaymentStatus.PartialCash;
                                            }

                                            try {
                                                await TransactionService.updatePaymentStatus(order.id, newStatus, newPaidAmount, newPayments);
                                                // Clear inputs
                                                amountInput.value = "";
                                                noteInput.value = "";
                                                onUpdate();
                                            } catch (error) {
                                                console.error("Error updating payment:", error);
                                                alert("Failed to record payment");
                                            }
                                        }}
                                        className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm text-sm whitespace-nowrap"
                                    >
                                        Record Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>


            </div>

            {/* Nested Modals */}
            {
                showCancelDialog && (
                    <CancelDialog
                        order={order}
                        onClose={() => setShowCancelDialog(false)}
                        onConfirm={(reason) => {
                            handleStatusChange(OrderStatus.Cancelled, reason);
                            setShowCancelDialog(false);
                        }}
                    />
                )
            }
            {
                showPaymentDialog && (
                    <OrderPartialPaymentDialog
                        order={order}
                        onClose={() => setShowPaymentDialog(false)}
                        onSuccess={onUpdate}
                    />
                )
            }
        </div >
    );
}
