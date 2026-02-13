"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { User, TransactionRecord, TransactionType } from "@/types";
import { toNepali } from "@/lib/date-helper";
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    TrendingUp,
    ShoppingBag,
    Search,
    Edit,
    UserPen,
    Clock,
    MapPin
} from "lucide-react";
import LogoLoader from "@/components/ui/LogoLoader";
import EditCustomerModal from "@/components/admin/EditCustomerModal";

import { useAuth } from "@/context/AuthContext";

export default function PartnerDetailsClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const { dbUser, loading: authLoading } = useAuth();

    const [partner, setPartner] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (loading) return;

        // Restrict access for managers
        if (dbUser?.role === 'manager') {
            router.push('/admin/partners');
            return;
        }

        if (id) {
            loadPartnerData();
        } else {
            // If no ID, redirect back
            // router.push("/admin/partners");
            setLoading(false);
        }
    }, [id, dbUser, loading]);

    const loadPartnerData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const user = await UserService.getUserById(id);
            if (!user) {
                alert("Partner not found");
                router.push("/admin/partners");
                return;
            }
            setPartner(user);

            // Determine if we show Sales (for Customers) or Purchases (for Vendors)
            // Default to Sales if not specified
            const type = user.partnerType === 'vendor' ? TransactionType.Purchase : TransactionType.Sale;

            // Fetch Transactions
            let txns = await TransactionService.getTransactionsByPartnerId(id, type);
            if (txns.length === 0) {
                // Fallback to name for legacy data
                txns = await TransactionService.getTransactionsByPartnerName(user.name, type);
            }
            setTransactions(txns);
        } catch (error) {
            console.error("Error loading partner details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePartner = async (userId: string, data: Partial<User>) => {
        try {
            await UserService.updateUser(userId, data);
            await loadPartnerData(); // Reload data to reflect changes
        } catch (error) {
            console.error("Failed to update partner:", error);
            throw error;
        }
    };

    // Computations for Metrics
    const totalOrders = transactions.length;

    const totalVolume = transactions.reduce((sum, t) => {
        const tTotal = t.items.reduce((iSum, item) => iSum + item.totalPrice, 0);
        return sum + (tTotal - t.discount);
    }, 0);

    const averageOrderValue = totalOrders > 0 ? totalVolume / totalOrders : 0;

    const lastOrderDate = transactions.length > 0 ? new Date(transactions[0].date) : null;

    // Calculate "days ago"
    const getLastOrderText = () => {
        if (!lastOrderDate) return "N/A";
        const diffTime = Math.abs(new Date().getTime() - lastOrderDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        return `${diffDays} days ago`;
    };

    // Calculate Prediction
    const getPredictionInfo = () => {
        if (transactions.length < 2) return null;

        let totalDiffDays = 0;
        // Sort transactions by date descending (already sorted from service, but ensure)
        const sortedTxns = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        for (let i = 0; i < sortedTxns.length - 1; i++) {
            const d1 = new Date(sortedTxns[i].date);
            const d2 = new Date(sortedTxns[i + 1].date);
            const diffTime = Math.abs(d1.getTime() - d2.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDiffDays += diffDays;
        }

        const avgFrequency = totalDiffDays / (transactions.length - 1);

        // Predict from last order
        if (!process.env.NEXT_PUBLIC_APP_VERSION && transactions.length > 0) {
            // just a check to ensure transactions exist, logic handled by length check
        }

        const lastDate = new Date(sortedTxns[0].date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + avgFrequency);

        return {
            date: nextDate,
            frequency: Math.round(avgFrequency)
        };
    };

    const prediction = getPredictionInfo();

    const formatDate = (date: Date | string) => {
        return toNepali(date, "DD MMM YYYY");
    };

    const filteredTransactions = transactions.filter(t =>
        t.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LogoLoader />
            </div>
        );
    }

    if (!partner) return null;

    const isCustomer = partner.partnerType !== 'vendor';

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/partners" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Edit Details"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <span className="capitalize">{partner.partnerType || 'Customer'}</span>
                        <span>•</span>
                        <span>{partner.phoneNumber || partner.email || 'No contact info'}</span>
                        {partner.address && (
                            <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{partner.address}</span>
                                </div>
                            </>
                        )}
                        <span>•</span>
                        <div className="flex items-center gap-1" title="Joined Date">
                            <Clock className="h-3 w-3" />
                            <span>Joined {toNepali(partner.createdAt, "DD MMM YYYY")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Spend/Sales */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${isCustomer ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCustomer ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                            LIFETIME
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Total Volume</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        Rs {totalVolume.toLocaleString()}
                    </h3>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        {totalOrders}
                    </h3>
                </div>

                {/* Average Order Value */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Avg. Order Value</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        Rs {Math.round(averageOrderValue).toLocaleString()}
                    </h3>
                </div>

                {/* Last Order */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Last Order</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        {getLastOrderText()}
                    </h3>
                    {lastOrderDate && (
                        <p className="text-xs text-gray-400 mt-1">{formatDate(lastOrderDate)}</p>
                    )}
                </div>

                {/* Prediction / Frequency */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-pink-100 text-pink-600">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Next Purchase</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        {prediction ? formatDate(prediction.date) : "N/A"}
                    </h3>
                    {prediction ? (
                        <p className="text-xs text-gray-400 mt-1">Every ~{prediction.frequency} days</p>
                    ) : (
                        <p className="text-xs text-gray-400 mt-1">Need more orders</p>
                    )}
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Bill No</th>
                                <th className="px-6 py-4 font-semibold">Items</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((txn) => {
                                    const total = txn.items.reduce((sum, item) => sum + item.totalPrice, 0) - txn.discount;
                                    return (
                                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(txn.date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    #{txn.billNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs truncate text-sm text-gray-900" title={txn.items.map(i => i.productName).join(', ')}>
                                                    {txn.items.map(i => i.productName).join(', ')}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {txn.items.length} items
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${txn.paymentStatus === 'PaidCash' || txn.paymentStatus === 'PaidOnline'
                                                    ? 'bg-green-100 text-green-700'
                                                    : txn.paymentStatus === 'Pending'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {txn.paymentStatus.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold ${isCustomer ? 'text-green-600' : 'text-red-600'}`}>
                                                    Rs {total.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {/* In a real app we might link to a transaction detail page or open a modal */}
                                                <span className="text-gray-400 text-xs">View</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Edit Modal */}
            <EditCustomerModal
                isOpen={isEditModalOpen}
                user={partner}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdatePartner}
            />
        </div>
    );
}
