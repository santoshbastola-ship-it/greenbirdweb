"use client";

import { useEffect, useState } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus, TransactionType, PaymentStatus, PaymentRecord } from "@/types";
import { Package, Calendar, User, ShoppingBag, ChevronDown, X, CreditCard, Search } from "lucide-react";
import { toNepali } from "@/lib/date-helper";

type TabStatus = OrderStatus;

export default function AdminOrdersPage() {
    const [activeTab, setActiveTab] = useState<TabStatus>(OrderStatus.Open);
    const [orders, setOrders] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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

    const filteredOrders = orders.filter(order => {
        const matchesStatus = order.status === activeTab;
        const matchesSearch = searchQuery === "" ||
            order.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.partyName.toLowerCase().includes(searchQuery.toLowerCase());

        const orderDate = new Date(order.date);
        const matchesStartDate = !startDate || orderDate >= new Date(startDate);
        const matchesEndDate = !endDate || orderDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999));

        return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
    });

    const tabs: { label: string; status: TabStatus; count: number }[] = [
        { label: "Open", status: OrderStatus.Open, count: orders.filter(o => o.status === OrderStatus.Open).length },
        { label: "Accepted", status: OrderStatus.Accepted, count: orders.filter(o => o.status === OrderStatus.Accepted).length },
        { label: "Delivered", status: OrderStatus.Delivered, count: orders.filter(o => o.status === OrderStatus.Delivered).length },
        { label: "Cancelled", status: OrderStatus.Cancelled, count: orders.filter(o => o.status === OrderStatus.Cancelled).length },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Order Management</h1>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Search Orders</label>
                            <input
                                type="text"
                                placeholder="Bill No or Party Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

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
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
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
                            <OrderCard key={order.id} order={order} onUpdate={loadOrders} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderCard({ order, onUpdate }: { order: TransactionRecord; onUpdate: () => void }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Open: return "blue";
            case OrderStatus.Accepted: return "yellow";
            case OrderStatus.Delivered: return "green";
            case OrderStatus.Cancelled: return "red";
            default: return "gray";
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

    const color = getStatusColor(order.status);
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
        green: "bg-green-50 text-green-700 border-green-200",
        red: "bg-red-50 text-red-700 border-red-200",
        gray: "bg-gray-50 text-gray-700 border-gray-200",
    };

    const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0) - (order.discount || 0);

    return (
        <>
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-green-200 transition-colors cursor-pointer"
                onClick={() => setShowDetails(true)}
            >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{order.billNo}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {toNepali(order.date, "DD MMM YYYY")} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-700">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">{order.partyName}</span>
                                {order.customerId && <span className="ml-2 text-xs text-gray-500">(Registered)</span>}
                            </div>
                            <div className="flex items-start text-gray-600">
                                <ShoppingBag className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                                <span>{order.items.map(i => `${i.productName} (${i.quantity} ${i.unit})`).join(", ")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-700">Rs. {totalAmount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Payment: {order.paymentStatus}</div>
                        </div>

                        {/* Status Dropdown */}
                        <StatusDropdown
                            currentStatus={order.status}
                            onStatusChange={handleStatusChange}
                            isUpdating={isUpdating}
                            onCancelClick={() => setShowCancelDialog(true)}
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(true);
                            }}
                            className="text-xs font-semibold text-green-600 hover:text-green-700 underline"
                        >
                            View Details
                        </button>
                    </div>
                </div>

                {order.status === OrderStatus.Cancelled && order.cancellationReason && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-red-600 italic">
                            <span className="font-semibold">Cancellation Reason:</span> {order.cancellationReason}
                        </p>
                    </div>
                )}
            </div>

            {/* Cancel Dialog */}
            {showCancelDialog && (
                <CancelDialog
                    order={order}
                    onClose={() => setShowCancelDialog(false)}
                    onConfirm={(reason) => {
                        handleStatusChange(OrderStatus.Cancelled, reason);
                        setShowCancelDialog(false);
                    }}
                />
            )}
            {/* Details Modal */}
            {showDetails && (
                <OrderDetailsModal
                    order={order}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </>
    );
}

function StatusDropdown({
    currentStatus,
    onStatusChange,
    isUpdating,
    onCancelClick,
}: {
    currentStatus: OrderStatus;
    onStatusChange: (status: OrderStatus) => void;
    isUpdating: boolean;
    onCancelClick: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Open: return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
            case OrderStatus.Accepted: return { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" };
            case OrderStatus.Delivered: return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
            case OrderStatus.Cancelled: return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
        }
    };

    const colors = getStatusColor(currentStatus);
    const statuses = [OrderStatus.Open, OrderStatus.Accepted, OrderStatus.Delivered, OrderStatus.Cancelled];
    const isCancelled = currentStatus === OrderStatus.Cancelled;

    return (
        <div className="relative">
            <button
                onClick={() => !isCancelled && setIsOpen(!isOpen)}
                disabled={isUpdating || isCancelled}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm transition-all ${colors.bg} ${colors.text} ${colors.border} ${isCancelled ? 'cursor-not-allowed opacity-75' : 'hover:opacity-80'} disabled:opacity-50`}
                title={isCancelled ? "Cancelled orders cannot be modified" : ""}
            >
                <span>{currentStatus}</span>
                {!isCancelled && <ChevronDown className="h-4 w-4" />}
            </button>

            {isOpen && !isCancelled && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        {statuses.map((status) => {
                            const statusColors = getStatusColor(status);
                            return (
                                <button
                                    key={status}
                                    onClick={() => {
                                        if (status === OrderStatus.Cancelled) {
                                            onCancelClick();
                                        } else {
                                            onStatusChange(status);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${status === currentStatus ? "bg-gray-50" : ""
                                        }`}
                                >
                                    <div className={`h-3 w-3 rounded-full ${statusColors.bg} ${statusColors.border} border`} />
                                    <span className="text-sm font-medium text-gray-700">{status}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
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
}: {
    order: TransactionRecord;
    onClose: () => void;
}) {
    const totalItemsPrice = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const finalTotal = totalItemsPrice - (order.discount || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{order.billNo}</h3>
                        <p className="text-sm text-gray-500">{toNepali(order.date, "DD MMM YYYY")} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Customer & Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h4>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-900 text-lg">{order.partyName}</p>
                                {order.customerId && (
                                    <div className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">
                                        Registered Customer
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Info</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium text-gray-900">Sold By:</span> {order.soldBy}</p>
                                <p><span className="font-medium text-gray-900">Status:</span> <span className="capitalize">{order.status}</span></p>
                                <p><span className="font-medium text-gray-900">Payment:</span> {order.paymentStatus}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Items</h4>
                        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {order.items.map((item, idx) => (
                                        <tr key={idx} className="text-gray-700">
                                            <td className="px-4 py-3 font-medium">{item.productName}</td>
                                            <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                                            <td className="px-4 py-3 text-right">Rs. {item.pricePerUnit.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-semibold">Rs. {item.totalPrice.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-white">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-right text-gray-500">Subtotal</td>
                                        <td className="px-4 py-2 text-right font-medium">Rs. {totalItemsPrice.toLocaleString()}</td>
                                    </tr>
                                    {order.discount > 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2 text-right text-red-500">Discount</td>
                                            <td className="px-4 py-2 text-right font-medium text-red-500">- Rs. {order.discount.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2 border-gray-100">
                                        <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-900 text-lg">Grand Total</td>
                                        <td className="px-4 py-4 text-right font-bold text-green-700 text-lg">Rs. {finalTotal.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Payment History */}
                    {order.payments && order.payments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Receipts</h4>
                            <div className="space-y-2">
                                {order.payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                                                <CreditCard className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">{toNepali(p.date, "DD MMM YYYY")}</p>
                                            </div>
                                        </div>
                                        {p.note && <span className="text-xs text-gray-400 italic">"{p.note}"</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {order.status === OrderStatus.Cancelled && order.cancellationReason && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Cancellation Reason</h4>
                            <p className="text-sm text-red-700 italic">{order.cancellationReason}</p>
                        </div>
                    )}

                    {/* Add Payment Section */}
                    {order.paymentStatus !== PaymentStatus.PaidCash && order.paymentStatus !== PaymentStatus.PaidOnline && (
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                            <h4 className="text-sm font-bold text-green-800 mb-3">Add Payment</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    id="paymentAmount"
                                    className="flex-1 px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Note (optional)"
                                    id="paymentNote"
                                    className="flex-[2] px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
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
                                            note: noteInput.value || "Admin payment"
                                        }];

                                        let newStatus = order.paymentStatus;
                                        if (newPaidAmount >= finalTotal) {
                                            newStatus = PaymentStatus.PaidCash;
                                        } else if (newPaidAmount > 0) {
                                            newStatus = PaymentStatus.PartialCash;
                                        }

                                        try {
                                            await TransactionService.updatePaymentStatus(order.id, newStatus, newPaidAmount, newPayments);
                                            alert("Payment recorded successfully");
                                            window.location.reload();
                                        } catch (error) {
                                            console.error("Error updating payment:", error);
                                            alert("Failed to record payment");
                                        }
                                    }}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm text-sm"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
