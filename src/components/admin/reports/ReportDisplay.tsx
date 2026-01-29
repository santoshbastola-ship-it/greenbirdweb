"use client";

import { TransactionRecord, ReportType, PaymentStatus, StockHistoryEntry } from "@/types";
import { toNepali } from "@/lib/date-helper";
import { Receipt, TrendingUp, Package as PackageIcon } from "lucide-react";

interface ReportDisplayProps {
    reportType: ReportType;
    transactions?: TransactionRecord[];
    stockEntries?: StockHistoryEntry[];
    totalCount: number;
    totalValue?: number;
    totalLabel?: string;
    stockSoldQty?: number;
}

export default function ReportDisplay({
    reportType,
    transactions = [],
    stockEntries = [],
    totalCount,
    totalValue,
    totalLabel,
    stockSoldQty
}: ReportDisplayProps) {

    const formatCurrency = (amount: number) => {
        return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getPaymentStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Pending:
                return "bg-red-100 text-red-800";
            case PaymentStatus.PaidCash:
            case PaymentStatus.PaidOnline:
                return "bg-green-100 text-green-800";
            case PaymentStatus.PartialCash:
            case PaymentStatus.PartialOnline:
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentStatusLabel = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Pending:
                return "Pending";
            case PaymentStatus.PaidCash:
                return "Paid Cash";
            case PaymentStatus.PaidOnline:
                return "Paid Online";
            case PaymentStatus.PartialCash:
                return "Partial Cash";
            case PaymentStatus.PartialOnline:
                return "Partial Online";
            default:
                return status;
        }
    };

    // Summary Cards
    const renderSummaryCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Total Records Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                        <Receipt className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Total Records</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-xs text-gray-500 mt-2">for selected period</p>
            </div>

            {/* Value Card */}
            {totalValue !== undefined && totalLabel && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-600">{totalLabel}</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                    <p className="text-xs text-gray-500 mt-2">for selected period</p>
                </div>
            )}

            {/* Stock Sold Quantity */}
            {stockSoldQty !== undefined && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <PackageIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-600">Total Sold Qty</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stockSoldQty}</p>
                    <p className="text-xs text-gray-500 mt-2">for selected period</p>
                </div>
            )}
        </div>
    );

    // Transaction Table
    const renderTransactionTable = () => {
        if (transactions.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No records found for the selected filters</p>
                </div>
            );
        }

        return (
            <>
                {/* Desktop View */}
                <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bill No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Party
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {toNepali(transaction.date, "DD MMM YYYY")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {transaction.billNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {transaction.partyName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {transaction.items.map(item => item.productName).join(", ")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - transaction.discount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                                                {getPaymentStatusLabel(transaction.paymentStatus)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-4">
                    {transactions.map((transaction) => (
                        <div key={transaction.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-gray-900">{transaction.partyName}</p>
                                    <p className="text-xs text-gray-500">{toNepali(transaction.date, "DD MMM YYYY")} • #{transaction.billNo}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                                    {getPaymentStatusLabel(transaction.paymentStatus)}
                                </span>
                            </div>

                            <div className="mb-3">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {transaction.items.map(item => item.productName).join(", ")}
                                </p>
                            </div>

                            <div className="flex justify-between items-center border-t pt-2 mt-2">
                                <span className="text-xs text-gray-500">Total Amount</span>
                                <span className="font-bold text-gray-900">
                                    {formatCurrency(transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - transaction.discount)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Stock Table
    const renderStockTable = () => {
        if (stockEntries.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <PackageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No stock records found for the selected filters</p>
                </div>
            );
        }

        return (
            <>
                {/* Desktop View */}
                <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Change
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        New Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Note
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stockEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {toNepali(entry.date, "DD MMM YYYY")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {entry.productId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                            {entry.actionType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={entry.changeAmount >= 0 ? "text-green-600" : "text-red-600"}>
                                                {entry.changeAmount >= 0 ? "+" : ""}{entry.changeAmount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {entry.newStock}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {entry.note || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-4">
                    {stockEntries.map((entry) => (
                        <div key={entry.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-gray-900">{entry.productId}</p>
                                    <p className="text-xs text-gray-500">{toNepali(entry.date, "DD MMM YYYY")}</p>
                                </div>
                                <span className="text-sm capitalize px-2 py-1 bg-gray-100 rounded-full">
                                    {entry.actionType}
                                </span>
                            </div>

                            <div className="flex justify-between items-center my-3">
                                <div>
                                    <span className="text-xs text-gray-500 block">Change</span>
                                    <span className={`font-bold ${entry.changeAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {entry.changeAmount >= 0 ? "+" : ""}{entry.changeAmount}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500 block">New Stock</span>
                                    <span className="font-bold text-gray-900">{entry.newStock}</span>
                                </div>
                            </div>

                            {entry.note && (
                                <div className="border-t pt-2 mt-2">
                                    <p className="text-xs text-gray-500 italic">"{entry.note}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div>
            {renderSummaryCards()}
            {reportType === ReportType.Stock ? renderStockTable() : renderTransactionTable()}
        </div>
    );
}
