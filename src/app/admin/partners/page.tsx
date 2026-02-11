"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { User, TransactionRecord } from "@/types";
import {
    Plus,
    Search,
    Users,
    ArrowLeft,
    Receipt,
    Store,
    UserCheck,
    Globe
} from "lucide-react";
import AddPartnerModal from "@/components/admin/AddPartnerModal";
import { toNepali } from "@/lib/date-helper";

export default function PartnersPage() {
    const [partners, setPartners] = useState<User[]>([]);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]); // Store all transactions for metrics
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"customer" | "vendor">("customer");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allPartners, allTransactions] = await Promise.all([
                UserService.getAllPartners(),
                TransactionService.getAllTransactions()
            ]);
            setPartners(allPartners);
            setTransactions(allTransactions);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPartner = async (data: any) => {
        await UserService.createCustomer(data);
        await loadData(); // Reload list after adding
    };

    // Helper: Get transactions for a specific partner
    const getPartnerTransactions = (partnerId: string) => {
        return transactions.filter(t =>
            t.customerId === partnerId &&
            t.status !== 'cancelled' &&
            // Filter by type based on partner role (though usually we want all relevant interaction)
            // For customers, we care about Sales. For vendors, Purchases.
            (activeTab === 'customer' ? t.type === 'Sale' : t.type === 'Purchase')
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    // Helper: Calculate Last Order Date
    const getLastOrderInfo = (partnerTxns: TransactionRecord[]) => {
        if (partnerTxns.length === 0) return null;
        const lastTxnDate = new Date(partnerTxns[0].date);
        const diffTime = Math.abs(new Date().getTime() - lastTxnDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { date: lastTxnDate, daysAgo: diffDays };
    };

    // Helper: Calculate Predicted Next Order
    const getPredictedNextOrder = (partnerTxns: TransactionRecord[]) => {
        if (partnerTxns.length < 2) return null; // Need at least 2 orders to calculate frequency

        // Calculate average days between orders
        let totalDiffDays = 0;
        for (let i = 0; i < partnerTxns.length - 1; i++) {
            const d1 = new Date(partnerTxns[i].date); // Most recent
            const d2 = new Date(partnerTxns[i + 1].date); // Previous
            const diffTime = Math.abs(d1.getTime() - d2.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDiffDays += diffDays;
        }

        const avgFrequency = totalDiffDays / (partnerTxns.length - 1);

        // Predict next date: Last Order Date + Avg Frequency
        const lastOrderDate = new Date(partnerTxns[0].date);
        const nextOrderDate = new Date(lastOrderDate);
        nextOrderDate.setDate(lastOrderDate.getDate() + avgFrequency);

        return { date: nextOrderDate, frequency: Math.round(avgFrequency) };
    };

    const filteredPartners = partners
        .filter((partner) => {
            // Filter by tab (customer or vendor)
            const partnerType = partner.partnerType || "customer";
            if (partnerType !== activeTab) return false;

            // Filter by search term
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    partner.name.toLowerCase().includes(search) ||
                    (partner.phoneNumber && partner.phoneNumber.includes(search)) ||
                    (partner.email && partner.email.toLowerCase().includes(search))
                );
            }
            return true;
        })
        .sort((a, b) => {
            // Sort by Created Date (Newest First)
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {activeTab === "customer" ? "Customer" : "Vendor"}
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab("customer")}
                            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === "customer"
                                ? "border-green-600 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Users className="h-5 w-5" />
                                <span>CUSTOMERS</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("vendor")}
                            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === "vendor"
                                ? "border-green-600 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Store className="h-5 w-5" />
                                <span>VENDORS</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Partners List */}
            {loading ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-100">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                    <p className="mt-4">Loading data...</p>
                </div>
            ) : filteredPartners.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    {activeTab === "customer" ? (
                        <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    ) : (
                        <Store className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    )}
                    <h3 className="text-lg font-medium text-gray-900">
                        No {activeTab === "customer" ? "customers" : "vendors"} found
                    </h3>
                    <p className="text-gray-500 mt-1">
                        {searchTerm
                            ? "Try adjusting your search"
                            : `Add a new ${activeTab === "customer" ? "customer" : "vendor"} to get started`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPartners.map((partner) => {
                        const partnerTxns = getPartnerTransactions(partner.id);
                        const lastOrder = getLastOrderInfo(partnerTxns);
                        const prediction = getPredictedNextOrder(partnerTxns);

                        return (
                            <Link
                                href={`/admin/partner-details?id=${partner.id}`}
                                key={partner.id}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-shadow gap-4 group cursor-pointer"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="h-12 w-12 flex-shrink-0 bg-green-100 rounded-full border border-green-200 flex items-center justify-center text-green-700 font-bold text-lg">
                                        {partner.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900 text-lg truncate">
                                                {partner.name}
                                            </h3>
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                                {partner.partnerType || "customer"}
                                            </span>
                                        </div>
                                        <span>{partner.phoneNumber || "No phone"}</span>
                                        {/* Status Icon */}
                                        <span className="flex items-center gap-1">
                                            {partner.email && !partner.email.endsWith('@manual.entry') ? (
                                                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100" title="Registered User">
                                                    <UserCheck className="h-3 w-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200" title="Manually Created">
                                                    <Users className="h-3 w-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Manual</span>
                                                </div>
                                            )}
                                        </span>


                                        {/* Activity Metrics */}
                                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                            {lastOrder ? (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium border border-blue-100">
                                                    Ordered {lastOrder.daysAgo} {lastOrder.daysAgo === 1 ? 'day' : 'days'} ago
                                                </span>
                                            ) : (
                                                <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                                                    No orders yet
                                                </span>
                                            )}

                                            {prediction && (
                                                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium border border-purple-100">
                                                    Next predicted: {toNepali(prediction.date, "DD MMM YYYY")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </Link>
                        );
                    })}
                </div>
            )
            }

            {
                isAddModalOpen && (
                    <AddPartnerModal
                        partnerType={activeTab}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAddPartner}
                    />
                )
            }
        </div >
    );
}
