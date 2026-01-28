"use client";

import { useEffect, useState } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, PaymentStatus } from "@/types";
import { ArrowLeft, Calendar, User, ShoppingBag, MapPin, Clock, MessageSquare, CreditCard, X, Printer } from "lucide-react";
import { toNepali } from "@/lib/date-helper";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SalesDetail() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadTransaction(id);
        }
    }, [id]);

    const loadTransaction = async (txId: string) => {
        setLoading(true);
        try {
            const data = await TransactionService.getTransactionById(txId);
            setTransaction(data);
        } catch (error) {
            console.error("Error loading transaction:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Loading details...</p>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
                <Link href="/admin/sales" className="text-green-600 hover:underline">Back to Sales</Link>
            </div>
        );
    }

    const totalItemsPrice = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const finalTotal = totalItemsPrice - (transaction.discount || 0);
    const remainingAmount = finalTotal - (transaction.paidAmount || 0);

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/admin/sales"
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Sales
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{transaction.billNo}</h1>
                        <div className="flex items-center text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            {toNepali(transaction.date, "DD MMM YYYY")}
                            <span className="mx-2">•</span>
                            <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                                {transaction.type}
                            </span>
                            <span className="mx-2">•</span>
                            <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold ${transaction.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {transaction.status}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold mb-2 ${transaction.paymentStatus.includes('Paid') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {transaction.paymentStatus}
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                            Rs. {finalTotal.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Delivery & Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Details</h4>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center mb-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-3">
                                        {transaction.partyName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{transaction.partyName}</p>
                                        <p className="text-xs text-gray-500">Customer</p>
                                    </div>
                                </div>
                                {(transaction.customerPhone || transaction.deliveryAddress) && (
                                    <div className="space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-3">
                                        {transaction.customerPhone && <p>Phone: {transaction.customerPhone}</p>}
                                        {transaction.deliveryAddress && <p>Address: {transaction.deliveryAddress}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {(transaction.expectedDeliveryTime || transaction.deliveryInstructions || transaction.deliveryAddress) && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Delivery Information</h4>
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                                    {transaction.deliveryAddress && (
                                        <div className="flex items-start gap-2 text-sm text-gray-700">
                                            <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-gray-900">Address:</span>
                                                <p className="leading-relaxed">{transaction.deliveryAddress}</p>
                                            </div>
                                        </div>
                                    )}
                                    {transaction.expectedDeliveryTime && (
                                        <div className="flex items-start gap-2 text-sm text-gray-700">
                                            <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-gray-900">Expected Time:</span>
                                                <p>
                                                    {typeof transaction.expectedDeliveryDate === 'string'
                                                        ? transaction.expectedDeliveryDate
                                                        : transaction.expectedDeliveryDate instanceof Date
                                                            ? toNepali(transaction.expectedDeliveryDate, "DD MMM YYYY")
                                                            : "Scheduled"} at {transaction.expectedDeliveryTime}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {transaction.deliveryInstructions && (
                                        <div className="flex items-start gap-2 text-sm text-gray-700">
                                            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-gray-900">Note:</span>
                                                <p className="italic text-gray-600">"{transaction.deliveryInstructions}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Transaction Items</h4>
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3">Item</th>
                                        <th className="px-5 py-3 text-right">Qty</th>
                                        <th className="px-5 py-3 text-right">Price</th>
                                        <th className="px-5 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transaction.items.map((item, idx) => (
                                        <tr key={idx} className="text-gray-700">
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-gray-900">{item.productName}</p>
                                                {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums">{item.quantity} {item.unit}</td>
                                            <td className="px-5 py-3 text-right tabular-nums">Rs. {item.pricePerUnit.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-right font-semibold tabular-nums">Rs. {item.totalPrice.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={3} className="px-5 py-2 text-right text-gray-500">Subtotal</td>
                                        <td className="px-5 py-2 text-right font-medium tabular-nums">Rs. {totalItemsPrice.toLocaleString()}</td>
                                    </tr>
                                    {transaction.discount > 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-5 py-2 text-right text-red-500">Discount</td>
                                            <td className="px-5 py-2 text-right font-medium text-red-500 tabular-nums">- Rs. {transaction.discount.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    <tr className="border-t border-gray-200">
                                        <td colSpan={3} className="px-5 py-4 text-right font-bold text-gray-900 text-lg">Grand Total</td>
                                        <td className="px-5 py-4 text-right font-bold text-green-700 text-lg tabular-nums">Rs. {finalTotal.toLocaleString()}</td>
                                    </tr>
                                    {remainingAmount > 0 && (transaction.paidAmount || 0) > 0 && (
                                        <tr className="bg-orange-50/50">
                                            <td colSpan={3} className="px-5 py-3 text-right font-semibold text-orange-800">Remaining Amount</td>
                                            <td className="px-5 py-3 text-right font-bold text-orange-700 tabular-nums">Rs. {remainingAmount.toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Payment History */}
                    {transaction.payments && transaction.payments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment History</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {transaction.payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mr-3 flex-shrink-0">
                                            <CreditCard className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{toNepali(p.date, "DD MMM YYYY")}</p>
                                        </div>
                                        {p.note && (
                                            <div className="ml-auto pl-3 border-l border-gray-100 text-xs text-gray-400 italic max-w-[100px] truncate">
                                                {p.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meta Info */}
                    <div className="text-xs text-gray-400 pt-6 border-t border-gray-100 flex justify-between">
                        <p>Ref ID: {transaction.id}</p>
                        <p>Sold By: {transaction.soldBy} • Entered By: {transaction.enteredBy}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SalesDetailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SalesDetail />
        </Suspense>
    );
}
