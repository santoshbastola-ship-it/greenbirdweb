"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Zap, Droplet, Flame, UtensilsCrossed, X, Trash2, Edit, Calendar, Clock, DollarSign } from "lucide-react";
import { EnergyBill, EnergyType, PaymentStatus } from "@/types";
import { FilterTab } from "@/components/ui/FilterTab";
import {
    subscribeToEnergyBills,
    deleteEnergyBill,
    getEnergyTypeDisplayName,
    getPaymentStatusDisplayName,
    calculateRemainingAmount,
    updatePaymentStatus
} from "@/services/energyService";
import AddEnergyBillModal from "@/components/admin/AddEnergyBillModal";
import EnergyBillDetailsModal from "@/components/admin/EnergyBillDetailsModal";
import PaymentStatusDropdown from "@/components/admin/PaymentStatusDropdown";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import { toNepali } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import dynamic from 'next/dynamic';

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";
import LogoLoader from "@/components/ui/LogoLoader";
import { useAuth } from "@/context/AuthContext";

type TabStatus = "Pending" | "Partial" | "Paid" | "All";

export default function EnergyBillsPage() {
    const { dbUser } = useAuth();
    const [bills, setBills] = useState<EnergyBill[]>([]);
    const [activeTab, setActiveTab] = useState<TabStatus>("Pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // const [editingBill, setEditingBill] = useState<EnergyBill | null>(null); // We might move edit to inside the modal or keep it here
    // For now let's keep the Edit flow simple: The AddEnergyBillModal handles both add and edit.
    // However, the requested flow is to match Order flow where we view details first.
    // Let's stick to the Plan: Click card -> Open Details Modal.
    // If we need to edit fields (like amount, reading date), we can add an "Edit" button in the Details modal that opens the AddEnergyBillModal in edit mode.
    // For this refactor, let's keep it simple: Click -> Details.

    // Actually, allowing Edit from the card or details modal is good. Let's keep a state for it.
    const [billToEdit, setBillToEdit] = useState<EnergyBill | null>(null);
    const [selectedBill, setSelectedBill] = useState<EnergyBill | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToEnergyBills(
            (fetchedBills) => {
                setBills(fetchedBills);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading bills:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this bill?")) return;

        try {
            await deleteEnergyBill(id, dbUser?.name || "Admin");
            // Subscription will update state
        } catch (error) {
            console.error("Error deleting bill:", error);
            alert("Failed to delete bill");
        }
    };

    // Sync selectedBill with updated bills list
    useEffect(() => {
        if (selectedBill) {
            const updated = bills.find(b => b.id === selectedBill.id);
            if (updated) {
                setSelectedBill(updated);
            }
        }
        if (billToEdit) {
            const updated = bills.find(b => b.id === billToEdit.id);
            if (updated) {
                setBillToEdit(updated);
            }
        }
    }, [bills]);

    const filteredBills = bills.filter((bill) => {
        // Status Filtering
        let matchesStatus = true;
        if (activeTab === "Pending") {
            matchesStatus = bill.paymentStatus === PaymentStatus.Pending;
        } else if (activeTab === "Partial") {
            matchesStatus = bill.paymentStatus === PaymentStatus.PartialCash || bill.paymentStatus === PaymentStatus.PartialOnline;
        } else if (activeTab === "Paid") {
            matchesStatus = bill.paymentStatus === PaymentStatus.PaidCash || bill.paymentStatus === PaymentStatus.PaidOnline;
        }

        // Search Filtering
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            getEnergyTypeDisplayName(bill.type).toLowerCase().includes(query) ||
            bill.amount.toString().includes(query) ||
            (bill.remarks && bill.remarks.toLowerCase().includes(query));

        // Date Filtering (Using Entry Date or maybe Due Date? Let's use Entry Date as default for chronological listing, similar to Orders)
        // Or maybe Bill Date (Month/Year)? entryDate seems safest.
        // Let's use entryDate if available, fallback to today?
        const billDate = bill.entryDate || new Date();
        // Note: bill.entryDate is a Date object from service conversion

        const dateToCheck = new Date(billDate);
        const matchesStartDate = !startDate || dateToCheck >= new NepaliDate(startDate).toJsDate();
        const matchesEndDate = !endDate || dateToCheck <= new Date(new NepaliDate(endDate).toJsDate().setHours(23, 59, 59, 999));

        return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => {
        // Sort by date descending
        const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
        const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
        return dateB - dateA;
    });

    const getTabCount = (tab: TabStatus) => {
        return bills.filter(bill => {
            if (tab === "Pending") return bill.paymentStatus === PaymentStatus.Pending;
            if (tab === "Partial") return bill.paymentStatus === PaymentStatus.PartialCash || bill.paymentStatus === PaymentStatus.PartialOnline;
            if (tab === "Paid") return bill.paymentStatus === PaymentStatus.PaidCash || bill.paymentStatus === PaymentStatus.PaidOnline;
            return true;
        }).length;
    };

    const tabs: { label: string; status: TabStatus }[] = [
        { label: "Pending", status: "Pending" },
        { label: "Partial", status: "Partial" },
        { label: "Paid", status: "Paid" },
        { label: "All", status: "All" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LogoLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Energy Bills</h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium w-full sm:w-auto"
                    >
                        <Plus className="h-5 w-5" />
                        Add Bill
                    </button>
                </div>

                {/* Filters */}
                <AdvancedSearch
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                    endDate={endDate}
                    onEndDateChange={setEndDate}
                    placeholder="Search"
                />

                {/* Tabs */}
                <div className="mb-6 -mx-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                        {tabs.map((tab) => (
                            <FilterTab
                                key={tab.status}
                                label={tab.label}
                                count={getTabCount(tab.status)}
                                active={activeTab === tab.status}
                                onClick={() => setActiveTab(tab.status)}
                            />
                        ))}
                    </div>
                </div>

                {/* Bills List */}
                {filteredBills.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <Zap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab === "All" ? "" : activeTab} bills found</h3>
                        <p className="text-gray-500">Bills matching your criteria will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBills.map((bill) => (
                            <BillCard
                                key={bill.id}
                                bill={bill}
                                onSelect={() => setSelectedBill(bill)}
                                onEdit={() => setBillToEdit(bill)}
                                onDelete={dbUser?.email === "santoshbastola@gmail.com" ? (e) => handleDelete(e, bill.id) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <AddEnergyBillModal
                    onClose={() => setIsAddModalOpen(false)}
                />
            )}

            {billToEdit && (
                <AddEnergyBillModal
                    bill={billToEdit}
                    onClose={() => setBillToEdit(null)}
                />
            )}

            {selectedBill && (
                <EnergyBillDetailsModal
                    bill={selectedBill}
                    onClose={() => setSelectedBill(null)}
                    onUpdate={() => {
                        // The subscription will auto-update the list (see previous comments)
                    }}
                    onEdit={() => {
                        setSelectedBill(null);
                        setBillToEdit(selectedBill);
                    }}
                />
            )}
        </div>
    );
}

function BillCard({
    bill,
    onSelect,
    onEdit,
    onDelete
}: {
    bill: EnergyBill;
    onSelect: () => void;
    onEdit: () => void;
    onDelete?: (e: React.MouseEvent) => void;
}) {
    const styles = getTypeStyles(bill.type);

    // Status Logic
    const isPaid = bill.paymentStatus === PaymentStatus.PaidCash || bill.paymentStatus === PaymentStatus.PaidOnline;
    const isPartial = bill.paymentStatus === PaymentStatus.PartialCash || bill.paymentStatus === PaymentStatus.PartialOnline;
    const amountColorClass = isPaid ? "text-green-600" : "text-red-600";

    const remaining = calculateRemainingAmount(bill);

    // Format Dates
    const entryDateStr = bill.entryDate ? toNepali(bill.entryDate, "DD MMM YYYY") : "N/A";
    const dueDateStr = bill.dueDate ? toNepali(bill.dueDate, "DD MMM YYYY") : null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                {/* Left: Type and Date */}
                <div className="min-w-0 flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                    <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${styles.bg} mt-1 sm:mt-0`}>
                        <styles.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.text}`} />
                    </div>
                    <div className="min-w-0">
                        <button
                            onClick={onSelect}
                            className="font-bold text-gray-900 text-base sm:text-lg hover:text-green-600 hover:underline transition-colors block truncate text-left"
                        >
                            {getEnergyTypeDisplayName(bill.type)}
                        </button>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                            <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {bill.month} {bill.year}
                            </span>
                            <span className="hidden sm:inline mx-2">•</span>
                            <span className="mt-0.5 sm:mt-0">{entryDateStr}</span>
                        </div>
                    </div>
                </div>

                {/* Middle: Details (Hidden on small mobile) */}
                <div className="hidden md:block flex-1 px-4">
                    {dueDateStr && (
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                            <Clock className="h-3 w-3 mr-1 text-orange-500" />
                            Due: {dueDateStr}
                        </div>
                    )}
                    {bill.remarks && (
                        <div className="text-xs text-gray-500 italic line-clamp-1">
                            "{bill.remarks}"
                        </div>
                    )}
                </div>

                {/* Right: Amount */}
                <div className="text-right flex-shrink-0">
                    <div className={`text-base sm:text-lg font-bold ${amountColorClass}`}>Rs. {bill.amount.toLocaleString()}</div>
                    {isPartial && remaining > 0 && (
                        <div className="text-[10px] sm:text-xs font-semibold text-orange-600">
                            Due: {remaining.toLocaleString()}
                        </div>
                    )}
                    <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-${isPaid ? "green" : isPartial ? "orange" : "red"
                            }-100 text-${isPaid ? "green" : isPartial ? "orange" : "red"
                            }-800`}>
                            {getPaymentStatusDisplayName(bill.paymentStatus)}
                        </span>
                    </div>
                </div>

                <div className="flex-shrink-0 ml-1 sm:ml-0">
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Bill"
                        >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Actions/Details */}
            <div className="sm:hidden mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3 overflow-hidden">
                    {dueDateStr && (
                        <span className="text-orange-600 flex items-center flex-shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {dueDateStr}
                        </span>
                    )}
                    {bill.remarks && (
                        <span className="text-gray-400 italic truncate">
                            {bill.remarks}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function getTypeStyles(type: EnergyType) {
    switch (type) {
        case EnergyType.Electricity:
            return { icon: Zap, bg: "bg-orange-50", text: "text-orange-600" };
        case EnergyType.Water:
            return { icon: Droplet, bg: "bg-blue-50", text: "text-blue-600" };
        case EnergyType.Gas:
            return { icon: Flame, bg: "bg-red-50", text: "text-red-600" };
        case EnergyType.Food:
            return { icon: UtensilsCrossed, bg: "bg-green-50", text: "text-green-600" };
        default:
            return { icon: Zap, bg: "bg-gray-50", text: "text-gray-600" };
    }
}
