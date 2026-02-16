"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus, PaymentStatus } from "@/types";
import { useRouter } from "next/navigation";
import { Package, Calendar, ChevronRight, X, AlertCircle, Clock, MessageSquare, Loader2, MapPin, QrCode, Download, ChevronDown, ShoppingBag, Ban, CreditCard, Banknote } from "lucide-react";
import { toNepali, formatTime } from "@/lib/date-helper";
import Link from "next/link";


type FilterStatus = 'all' | 'payment_pending' | OrderStatus;

export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>(OrderStatus.Open);

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

    const filteredOrders = filter === 'all'
        ? orders
        : filter === 'payment_pending'
            ? orders.filter(order => (order.paymentStatus === PaymentStatus.Pending || order.paymentStatus === PaymentStatus.PartialCash || order.paymentStatus === PaymentStatus.PartialOnline) && order.status !== OrderStatus.Cancelled)
            : filter === OrderStatus.Open
                ? orders.filter(order => order.status === OrderStatus.Open || order.status === OrderStatus.Accepted)
                : orders.filter(order => order.status === filter);

    const filterLabel = filter === 'all' ? '' : filter.replace(/_/g, ' ');

    if (loading || authLoading) return (
        <div className="min-h-screen pt-32 pb-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 py-8 pb-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage your recent orders.</p>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100/50 dark:border-gray-700">
                        <div className="bg-green-50 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No orders yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Start shopping to fill this page!</p>
                        <Link href="/shop" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-green-200 shadow-lg hover:shadow-xl active:scale-95">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Filter Tabs - Scrollable on mobile */}
                        <div className="mb-6 -mx-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
                            <div className="flex gap-2 min-w-max">
                                <FilterTab
                                    label="Payment Pending"
                                    count={orders.filter(o => (o.paymentStatus === PaymentStatus.Pending || o.paymentStatus === PaymentStatus.PartialCash || o.paymentStatus === PaymentStatus.PartialOnline) && o.status !== OrderStatus.Cancelled).length}
                                    active={filter === 'payment_pending'}
                                    onClick={() => setFilter('payment_pending')}
                                />
                                <FilterTab
                                    label="Open"
                                    count={orders.filter(o => o.status === OrderStatus.Open || o.status === OrderStatus.Accepted).length}
                                    active={filter === OrderStatus.Open}
                                    onClick={() => setFilter(OrderStatus.Open)}
                                />
                                <FilterTab
                                    label="Delivered"
                                    count={orders.filter(o => o.status === OrderStatus.Delivered).length}
                                    active={filter === OrderStatus.Delivered}
                                    onClick={() => setFilter(OrderStatus.Delivered)}
                                />
                                <FilterTab
                                    label="Cancelled"
                                    count={orders.filter(o => o.status === OrderStatus.Cancelled).length}
                                    active={filter === OrderStatus.Cancelled}
                                    onClick={() => setFilter(OrderStatus.Cancelled)}
                                />
                                <FilterTab
                                    label="All"
                                    count={orders.length}
                                    active={filter === 'all'}
                                    onClick={() => setFilter('all')}
                                />
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No {filterLabel} orders found</p>
                                </div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <OrderCard key={order.id} order={order} onUpdate={loadOrders} />
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function FilterTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full font-semibold text-xs border transition-all whitespace-nowrap ${active
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
        >
            {label}
            {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function OrderCard({ order, onUpdate }: { order: TransactionRecord; onUpdate: () => void }) {
    const { dbUser, user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleCancelOrder = async (reason: string) => {
        setIsUpdating(true);
        try {
            await TransactionService.updateTransactionStatus(order.id, OrderStatus.Cancelled, reason, dbUser?.name || user?.displayName || "Customer");
            onUpdate();
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert("Failed to cancel order. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const canCancel = order.status === OrderStatus.Open || order.status === OrderStatus.Accepted;
    const isPaid = order.paymentStatus === PaymentStatus.PaidCash || order.paymentStatus === PaymentStatus.PaidOnline;
    const grandTotal = getGrandTotal(order);
    const remainingAmount = grandTotal - (order.paidAmount || 0);

    // Helper to extract time string safely
    const getTimeString = (date: any) => {
        if (!date) return "";
        try {
            let jsDate: Date;
            if (date instanceof Date) jsDate = date;
            else if (typeof date.toDate === 'function') jsDate = date.toDate();
            else if (typeof date === 'object' && date.seconds !== undefined) jsDate = new Date(date.seconds * 1000);
            else jsDate = new Date(date);

            // Check for invalid date
            if (isNaN(jsDate.getTime())) return "";

            return jsDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) {
            console.error("Error formatting time:", e);
            return "";
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
                <div className="p-5">
                    {/* Header: ID, Date, Amount */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">#{order.billNo}</h3>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>{toNepali(order.date, "DD MMM")} &bull; {getTimeString(order.date)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-xl text-gray-900 dark:text-white">Rs. {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Status Icons */}
                    <div className="flex gap-3 mb-5 flex-wrap">
                        <StatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />

                        {/* Delivery Time Badge if available */}
                        {(order.expectedDeliveryTime || order.expectedDeliveryDate) && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-100 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">
                                <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                <span>
                                    {typeof order.expectedDeliveryDate === 'string'
                                        ? order.expectedDeliveryDate
                                        : (order.expectedDeliveryDate && (order.expectedDeliveryDate instanceof Date || typeof order.expectedDeliveryDate === 'object'))
                                            ? toNepali(order.expectedDeliveryDate, "DD MMM")
                                            : "Scheduled"}
                                    {order.expectedDeliveryTime && ` • ${formatTime(order.expectedDeliveryTime)}`}
                                </span>
                            </span>
                        )}


                    </div>

                    {/* Main Actions */}
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                        {!isPaid && order.status !== OrderStatus.Cancelled ? (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-green-100 hover:bg-green-700 active:scale-95 transition-all"
                            >
                                <QrCode className="h-4 w-4" />
                                <span>Pay Now</span>
                            </button>
                        ) : (
                            <div className="flex-1"></div> /* Spacer if no pay button */
                        )}

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Expanded Details Section */}
                <div className={`transition-all duration-300 ease-in-out bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                    <div className="p-5">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-3">Order Details</p>

                        {/* Order Items */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Rs. {(item.quantity * item.pricePerUnit).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-2 mb-4 px-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                <span className="font-medium text-gray-900 dark:text-white">Rs. {order.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0).toLocaleString()}</span>
                            </div>

                            {(order.deliveryFee || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                                    <span className="font-medium text-gray-900 dark:text-white">Rs. {order.deliveryFee?.toLocaleString()}</span>
                                </div>
                            )}

                            {(order.discount || 0) > 0 && (
                                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                    <span>Discount</span>
                                    <span>- Rs. {order.discount?.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-600 flex justify-between">
                                <span className="font-bold text-gray-900 dark:text-white">Grand Total</span>
                                <span className="font-bold text-gray-900 dark:text-white">Rs. {grandTotal.toLocaleString()}</span>
                            </div>
                        </div>


                        {/* Delivery Info */}
                        {(order.deliveryAddress || order.deliveryInstructions) && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <MapPin className="h-3 w-3" /> Delivery Info
                                </h4>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    {order.deliveryAddress && (
                                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1 font-medium">{order.deliveryAddress}</p>
                                    )}
                                    {order.deliveryInstructions && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2 border-t border-dashed border-gray-100 dark:border-gray-700 pt-2">
                                            "{order.deliveryInstructions}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Cancel Button - Relocated to the bottom */}
                        {canCancel && (
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={() => setShowCancelDialog(true)}
                                    disabled={isUpdating}
                                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Ban className="h-3.5 w-3.5" />
                                    <span>Cancel Order</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCancelDialog && (
                <CancelOrderDialog
                    order={order}
                    isLoading={isUpdating}
                    onClose={() => setShowCancelDialog(false)}
                    onConfirm={async (reason) => {
                        await handleCancelOrder(reason);
                        setShowCancelDialog(false);
                    }}
                />
            )}

            {showPaymentModal && (
                <PaymentModal
                    order={order}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}
        </>
    );
}

function PaymentModal({ order, onClose }: { order: TransactionRecord; onClose: () => void }) {
    const totalAmount = getGrandTotal(order);
    const remainingAmount = totalAmount - (order.paidAmount || 0);

    const handleDownload = async (url: string, name: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = name;
            // target="_blank" allows iOS to open it in a new tab if it refuses to download,
            // preventing the current page from navigating away and getting stuck.
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup the blob URL after a short delay
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error("Download failed, falling back to direct link:", error);
            // Fallback: just open/download the URL directly
            const link = document.createElement("a");
            link.href = url;
            link.download = name;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Make Payment</h3>
                        <button onClick={() => onClose()} className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100 text-center">
                        <span className="block text-green-800 text-xs uppercase font-bold tracking-wider mb-1">Amount Due</span>
                        <span className="block text-3xl font-extrabold text-green-700">Rs. {remainingAmount.toLocaleString()}</span>
                    </div>

                    <p className="text-xs text-gray-500 text-center mb-4 font-medium">Scan QR to pay with any supported app</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* eSewa QR */}
                        <div className="flex flex-col items-center">
                            <div className="p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm w-full relative group">
                                <img
                                    src="/images/esewa_qr.jpg"
                                    alt="eSewa QR Code"
                                    className="w-full h-auto object-contain rounded-lg aspect-square"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://placehold.co/400x400/f0fdf4/166534?text=eSewa+QR";
                                    }}
                                />
                                <button
                                    onClick={() => handleDownload("/images/esewa_qr.jpg", "esewa_qr.jpg")}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white text-gray-600 hover:text-green-600 transition-all opacity-0 group-hover:opacity-100"
                                    title="Download QR"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <button
                                onClick={() => handleDownload("/images/esewa_qr.jpg", "esewa_qr.jpg")}
                                className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-full text-[10px] font-bold transition-colors"
                            >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                            </button>
                        </div>

                        {/* Khalti QR */}
                        <div className="flex flex-col items-center">
                            <div className="p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm w-full relative group">
                                <img
                                    src="/images/khalti_qr.jpg"
                                    alt="Khalti QR Code"
                                    className="w-full h-auto object-contain rounded-lg aspect-square"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://placehold.co/400x400/fbf0ff/6b21a8?text=Khalti+QR";
                                    }}
                                />
                                <button
                                    onClick={() => handleDownload("/images/khalti_qr.jpg", "khalti_qr.jpg")}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white text-gray-600 hover:text-purple-600 transition-all opacity-0 group-hover:opacity-100"
                                    title="Download QR"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <button
                                onClick={() => handleDownload("/images/khalti_qr.jpg", "khalti_qr.jpg")}
                                className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full text-[10px] font-bold transition-colors"
                            >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-center">
                        <p className="text-xs font-medium text-blue-800 flex items-center justify-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Please share the payment screenshot to us.
                        </p>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                            Payment status will be updated after verification.
                        </p>
                        <p className="text-sm font-bold text-gray-900">Thank you!</p>
                    </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                    <button
                        onClick={() => onClose()}
                        className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: OrderStatus }) {
    const styles = {
        [OrderStatus.Open]: "bg-blue-50 text-blue-700 border-blue-100",
        [OrderStatus.Accepted]: "bg-amber-50 text-amber-700 border-amber-100",
        [OrderStatus.Delivered]: "bg-emerald-50 text-emerald-700 border-emerald-100",
        [OrderStatus.Cancelled]: "bg-red-50 text-red-700 border-red-100",
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${styles[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
            <Package className="h-3.5 w-3.5" />
            <span className="text-xs font-bold uppercase">{status}</span>
        </div>
    );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const styles = {
        [PaymentStatus.Pending]: "bg-orange-50 text-orange-700 border-orange-100",
        [PaymentStatus.PaidCash]: "bg-green-50 text-green-700 border-green-100",
        [PaymentStatus.PaidOnline]: "bg-blue-50 text-blue-700 border-blue-100",
        [PaymentStatus.PartialCash]: "bg-yellow-50 text-yellow-700 border-yellow-100",
        [PaymentStatus.PartialOnline]: "bg-yellow-50 text-yellow-700 border-yellow-100",
    };

    const labels = {
        [PaymentStatus.Pending]: "Payment Pending",
        [PaymentStatus.PaidCash]: "Paid (Cash)",
        [PaymentStatus.PaidOnline]: "Paid (Online)",
        [PaymentStatus.PartialCash]: "Partially Paid",
        [PaymentStatus.PartialOnline]: "Partially Paid",
    };

    // Choose icon based on functionality (generic clock for pending, etc)
    const Icon = status === PaymentStatus.Pending ? Banknote : CreditCard;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${styles[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs font-bold uppercase">{labels[status] || status}</span>
        </div>
    );
}

function getGrandTotal(order: TransactionRecord) {
    const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    return subtotal + (order.deliveryFee || 0) - (order.discount || 0);
}

function CancelOrderDialog({
    order,
    isLoading,
    onClose,
    onConfirm,
}: {
    order: TransactionRecord;
    isLoading: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}) {
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const predefinedReasons = [
        "Changed my mind",
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to cancel order <span className="font-bold text-gray-900">#{order.billNo}</span>?
                </p>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Reason
                    </label>
                    <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
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
                            className="mt-3 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            rows={3}
                            placeholder="Please specify your reason..."
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Keep Order
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-red-200 shadow-lg"
                    >
                        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                        {isLoading ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}
