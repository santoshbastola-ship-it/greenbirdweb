"use client";

import { useState, useEffect } from "react";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, TransactionType } from "@/types";

interface PartnerTransactionDialogProps {
    partnerId: string;
    partnerName: string;
    partnerType: "customer" | "vendor";
    onClose: () => void;
}

export default function PartnerTransactionDialog({
    partnerId,
    partnerName,
    partnerType,
    onClose
}: PartnerTransactionDialogProps) {
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, [partnerId, partnerType]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            // Vendors: show only Purchases, Customers: show only Sales
            const expectedType = partnerType === "vendor"
                ? TransactionType.Purchase
                : TransactionType.Sale;

            // Try fetching by ID first, then fallback to name
            let txns = await TransactionService.getTransactionsByPartnerId(partnerId, expectedType);

            if (txns.length === 0) {
                // Fallback to name-based query for backward compatibility
                txns = await TransactionService.getTransactionsByPartnerName(partnerName, expectedType);
            }

            setTransactions(txns);
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = transactions.reduce((sum, t) => {
        const total = t.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
        return sum + (total - t.discount);
    }, 0);

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getItemsSummary = (transaction: TransactionRecord) => {
        return transaction.items.map(item => item.productName).join(", ");
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {partnerType === "vendor" ? "Purchase History" : "Sales History"}
                            </h3>
                            <p className="text-gray-600 mt-1">{partnerName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-pulse space-y-4 w-full">
                                <div className="h-20 bg-gray-200 rounded"></div>
                                <div className="h-20 bg-gray-200 rounded"></div>
                                <div className="h-20 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-2">
                                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h4>
                            <p className="text-gray-500">This partner has no transaction history yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((transaction) => {
                                const isSale = transaction.type === TransactionType.Sale;
                                const total = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0);
                                const finalAmount = total - transaction.discount;

                                return (
                                    <div
                                        key={transaction.id}
                                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Transaction Header */}
                                        <div className={`px-4 py-3 ${isSale ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {isSale ? (
                                                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                                                    )}
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {formatDate(transaction.date)}
                                                    </span>
                                                </div>
                                                <span className={`text-lg font-bold ${isSale ? 'text-green-700' : 'text-red-700'}`}>
                                                    Rs {finalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Transaction Details */}
                                        <div className="px-4 py-3 bg-white">
                                            <p className="font-medium text-gray-900 mb-2">
                                                {getItemsSummary(transaction)}
                                            </p>
                                            <div className="flex items-center space-x-3 text-xs">
                                                <span className={`px-2 py-1 rounded-full font-semibold ${transaction.paymentStatus === 'PaidCash' || transaction.paymentStatus === 'PaidOnline'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {transaction.paymentStatus.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                {transaction.discount > 0 && (
                                                    <span className="text-gray-600">
                                                        Discount: Rs {transaction.discount.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {transactions.length > 0 && (
                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Total Transaction Amount:</span>
                            <span className="text-xl font-bold text-green-600">
                                Rs {totalAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
