"use client";

import { toNepali } from "@/lib/date-helper";
import Link from "next/link";
import { Plus, Search, FileText, ArrowUpRight, ArrowDownLeft, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, TransactionType } from "@/types";

export default function SalesListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"All" | "Sale" | "Purchase">("All");

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
        const matchesSearch = t.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTab = activeTab === "All" || t.type === activeTab;

        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales & Purchase</h1>
                        <p className="text-gray-500">Track your farm income and expenses</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/sales/new-purchase"
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg shadow-red-900/10"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Purchase
                    </Link>
                    <Link
                        href="/admin/sales/new"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center shadow-lg shadow-green-900/10"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Sale
                    </Link>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    {(["All", "Sale", "Purchase"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-md font-medium transition-all ${activeTab === tab
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab === "Sale" ? "Sales" : tab === "Purchase" ? "Purchases" : "All"}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, bill, or item..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="h-10 w-10 animate-spin mb-4 text-green-600" />
                        <p>Loading transactions...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No transactions found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date / Bill</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors text-sm">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{toNepali(t.date instanceof Date ? t.date : new Date(t.date), 'DD MMM YYYY')}</div>
                                            <div className="text-xs text-gray-500 font-mono">{t.billNo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                            {t.partyName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === TransactionType.Sale ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {t.type === TransactionType.Sale ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownLeft className="h-3 w-3 mr-1" />}
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 truncate max-w-[200px]">
                                            {t.items.map(i => i.productName).join(", ")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                            Rs {t.items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.paymentStatus.includes('Paid') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {t.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
