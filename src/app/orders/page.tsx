"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus } from "@/types";
import { useRouter } from "next/navigation";
import { Package, Calendar, ChevronRight, X, AlertCircle } from "lucide-react";
import { toNepali } from "@/lib/date-helper";
import Link from "next/link";


export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/orders");
        }
    }, [user, authLoading, router]);

    const loadOrders = async () => {
        if (user) {
            setLoading(true);
            try {
                const data = await TransactionService.getTransactionsByCustomerId(user.uid);
                setOrders(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadOrders();
    }, [user]);

    if (loading || authLoading) return <div className="min-h-screen pt-20 text-center">Loading orders...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
                        <Link href="/shop" className="bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} onUpdate={loadOrders} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderCard({ order, onUpdate }: { order: TransactionRecord; onUpdate: () => void }) {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleCancelOrder = async (reason: string) => {
        setIsUpdating(true);
        try {
            await TransactionService.updateTransactionStatus(order.id, OrderStatus.Cancelled, reason);
            onUpdate();
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert("Failed to cancel order. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const canCancel = order.status === OrderStatus.Open || order.status === OrderStatus.Accepted;

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-green-200 transition-colors">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div className="flex items-start md:items-center space-x-4 mb-4 md:mb-0">
                            <div className="bg-green-50 p-3 rounded-lg">
                                <Package className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Order #{order.billNo}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {toNepali(order.date, "DD MMM YYYY")} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <StatusBadge status={order.status} />
                            <span className="font-bold text-lg text-gray-900">Rs. {getGrandTotal(order)}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Items</h4>
                        <div className="space-y-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <span className="font-medium text-gray-900 mr-2">{item.productName}</span>
                                        <span className="text-gray-500">
                                            ({item.quantity} {item.unit} x {item.pricePerUnit})
                                        </span>
                                    </div>
                                    <span className="font-medium text-gray-900">
                                        Rs. {(item.quantity * item.pricePerUnit).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {order.status === OrderStatus.Cancelled && order.cancellationReason && (
                        <div className="mt-4 pt-4 border-t border-gray-100 bg-red-50 -mx-6 -mb-6 px-6 py-4">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-red-900">Order Cancelled</p>
                                    <p className="text-sm text-red-700 mt-1">
                                        <span className="font-medium">Reason:</span> {order.cancellationReason}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {canCancel && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowCancelDialog(true)}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel Order
                            </button>
                        </div>
                    )}

                    {order.enteredBy === 'admin' ?
                        <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 italic">
                            Placed via Store
                        </div>
                        : null}
                </div>
            </div>

            {showCancelDialog && (
                <CancelOrderDialog
                    order={order}
                    onClose={() => setShowCancelDialog(false)}
                    onConfirm={(reason) => {
                        handleCancelOrder(reason);
                        setShowCancelDialog(false);
                    }}
                />
            )}
        </>
    );
}

function StatusBadge({ status }: { status: OrderStatus }) {
    const colors = {
        [OrderStatus.Open]: "bg-blue-100 text-blue-800",
        [OrderStatus.Accepted]: "bg-yellow-100 text-yellow-800",
        [OrderStatus.Delivered]: "bg-green-100 text-green-800",
        [OrderStatus.Cancelled]: "bg-red-100 text-red-800",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}

function getGrandTotal(order: TransactionRecord) {
    return order.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0) - (order.discount || 0);
}

function CancelOrderDialog({
    order,
    onClose,
    onConfirm,
}: {
    order: TransactionRecord;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}) {
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const predefinedReasons = [
        "Changed my mind",
        "Found better price elsewhere",
        "Ordered by mistake",
        "Delivery time too long",
        "Product no longer needed",
        "Other"
    ];

    const handleConfirm = () => {
        const finalReason = selectedReason === "Other" ? customReason.trim() : selectedReason;

        if (!finalReason) {
            alert("Please select or enter a cancellation reason");
            return;
        }

        onConfirm(finalReason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <p className="text-gray-600 mb-4">
                    Are you sure you want to cancel order <span className="font-semibold">#{order.billNo}</span>?
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 mb-3"
                    >
                        <option value="">Select a reason...</option>
                        {predefinedReasons.map((reason) => (
                            <option key={reason} value={reason}>
                                {reason}
                            </option>
                        ))}
                    </select>

                    {selectedReason === "Other" && (
                        <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            rows={3}
                            placeholder="Please specify your reason..."
                        />
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Keep Order
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        Cancel Order
                    </button>
                </div>
            </div>
        </div>
    );
}
