"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserService } from "@/services/user.service";
import { User } from "@/types";
import {
    Plus,
    Search,
    Users,
    ArrowLeft,
    Phone,
    MapPin,
    Mail,
    Receipt,
    Store
} from "lucide-react";
import AddPartnerModal from "@/components/admin/AddPartnerModal";
import PartnerTransactionDialog from "@/components/admin/PartnerTransactionDialog";

export default function PartnersPage() {
    const [partners, setPartners] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"customer" | "vendor">("customer");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<User | null>(null);

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        setLoading(true);
        const allPartners = await UserService.getAllPartners();
        setPartners(allPartners);
        setLoading(false);
    };

    const handleAddPartner = async (data: any) => {
        await UserService.createCustomer(data);
        await loadPartners(); // Reload list after adding
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
            // Sort by total transaction amount (highest first)
            const aTotal = a.totalTransactionAmount || 0;
            const bTotal = b.totalTransactionAmount || 0;
            return bTotal - aTotal;
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
                        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
                        <p className="text-gray-500">Manage your customers and vendors</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center shadow-sm"
                >
                    <Plus className="h-5 w-5 mr-2" />
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
                            placeholder="Search by name, email, or phone..."
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
                    <p className="mt-4">Loading partners...</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPartners.map((partner) => (
                        <div
                            key={partner.id}
                            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-green-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center flex-1 min-w-0">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg border-2 border-green-50 flex-shrink-0">
                                        {partner.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="ml-3 min-w-0 flex-1">
                                        <h3 className="font-semibold text-gray-900 truncate" title={partner.name}>
                                            {partner.name}
                                        </h3>
                                        {partner.totalTransactionAmount && partner.totalTransactionAmount > 0 ? (
                                            <p className="text-sm font-medium text-green-600">
                                                Rs {partner.totalTransactionAmount.toFixed(2)}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400">No transactions</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5 text-sm text-gray-600 mb-4">
                                {partner.phoneNumber ? (
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2.5 text-green-600 flex-shrink-0" />
                                        <span className="font-medium truncate">{partner.phoneNumber}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-gray-400">
                                        <Phone className="h-4 w-4 mr-2.5 flex-shrink-0" />
                                        <span className="italic">No phone number</span>
                                    </div>
                                )}

                                {partner.email && !partner.email.includes("@manual.entry") ? (
                                    <div className="flex items-center">
                                        <Mail className="h-4 w-4 mr-2.5 text-green-600 flex-shrink-0" />
                                        <span className="truncate" title={partner.email}>{partner.email}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-gray-400">
                                        <Mail className="h-4 w-4 mr-2.5 flex-shrink-0" />
                                        <span className="italic">No email</span>
                                    </div>
                                )}

                                {partner.address ? (
                                    <div className="flex items-start">
                                        <MapPin className="h-4 w-4 mr-2.5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{partner.address}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-start text-gray-400">
                                        <MapPin className="h-4 w-4 mr-2.5 mt-0.5 flex-shrink-0" />
                                        <span className="italic">No address</span>
                                    </div>
                                )}

                                {partner.remarks && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 italic line-clamp-2">
                                            {partner.remarks}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedPartner(partner)}
                                className="w-full mt-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center text-sm"
                            >
                                <Receipt className="h-4 w-4 mr-2" />
                                View Transactions
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isAddModalOpen && (
                <AddPartnerModal
                    partnerType={activeTab}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={handleAddPartner}
                />
            )}

            {selectedPartner && (
                <PartnerTransactionDialog
                    partnerId={selectedPartner.id}
                    partnerName={selectedPartner.name}
                    partnerType={selectedPartner.partnerType || "customer"}
                    onClose={() => setSelectedPartner(null)}
                />
            )}
        </div>
    );
}
