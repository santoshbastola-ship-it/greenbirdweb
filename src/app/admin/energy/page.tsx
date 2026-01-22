"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Zap, Droplet, Flame, UtensilsCrossed, X, Trash2, Edit } from "lucide-react";
import { EnergyBill, EnergyType, PaymentStatus } from "@/types";
import {
    subscribeToEnergyBills,
    deleteEnergyBill,
    getEnergyTypeDisplayName,
    getPaymentStatusDisplayName,
    calculateRemainingAmount,
    updatePaymentStatus
} from "@/services/energyService";
import AddEnergyBillModal from "@/components/admin/AddEnergyBillModal";
import PartialPaymentDialog from "@/components/admin/PartialPaymentDialog";

export default function EnergyBillsPage() {
    const [bills, setBills] = useState<EnergyBill[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<EnergyBill | null>(null);
    const [partialPaymentBill, setPartialPaymentBill] = useState<EnergyBill | null>(null);
    const [showPaidBills, setShowPaidBills] = useState(false);
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

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this bill?")) {
            try {
                await deleteEnergyBill(id);
            } catch (error) {
                alert("Error deleting bill");
            }
        }
    };

    const handleStatusChange = async (bill: EnergyBill, newStatus: PaymentStatus) => {
        if (newStatus === bill.paymentStatus) return;

        // If changing to partial, show dialog
        if (newStatus === PaymentStatus.PartialCash || newStatus === PaymentStatus.PartialOnline) {
            setPartialPaymentBill(bill);
            return;
        }

        // Otherwise update directly
        try {
            let paidAmount = 0;
            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                paidAmount = bill.amount;
            }
            await updatePaymentStatus(bill.id, newStatus, paidAmount);
        } catch (error) {
            alert("Error updating payment status");
        }
    };

    // Filter bills
    const filteredBills = bills.filter((bill) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            getEnergyTypeDisplayName(bill.type).toLowerCase().includes(query) ||
            bill.amount.toString().includes(query) ||
            getPaymentStatusDisplayName(bill.paymentStatus).toLowerCase().includes(query) ||
            (bill.remarks && bill.remarks.toLowerCase().includes(query))
        );
    });

    // Separate pending and paid
    const pendingBills = filteredBills.filter(
        (b) => b.paymentStatus === PaymentStatus.Pending ||
            b.paymentStatus === PaymentStatus.PartialCash ||
            b.paymentStatus === PaymentStatus.PartialOnline
    );
    const paidBills = filteredBills.filter(
        (b) => b.paymentStatus === PaymentStatus.PaidCash ||
            b.paymentStatus === PaymentStatus.PaidOnline
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Energy Bills</h1>
                    <p className="text-gray-500">Manage electricity, water, gas, and food bills</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Bill
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by type, amount, status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>

            {/* Pending Bills Section */}
            {pendingBills.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-orange-700">Pending / Partial</h2>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full">
                            {pendingBills.length}
                        </span>
                    </div>
                    <div className="grid gap-4">
                        {pendingBills.map((bill) => (
                            <BillCard
                                key={bill.id}
                                bill={bill}
                                onEdit={() => setEditingBill(bill)}
                                onDelete={() => handleDelete(bill.id)}
                                onStatusChange={(status) => handleStatusChange(bill, status)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Paid Bills Section (Collapsible) */}
            {paidBills.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <button
                        onClick={() => setShowPaidBills(!showPaidBills)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-green-700">Paid Bills</h2>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                                {paidBills.length}
                            </span>
                        </div>
                        <svg
                            className={`h-5 w-5 text-gray-500 transition-transform ${showPaidBills ? "rotate-180" : ""
                                }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showPaidBills && (
                        <div className="p-4 pt-0 space-y-4">
                            {paidBills.map((bill) => (
                                <BillCard
                                    key={bill.id}
                                    bill={bill}
                                    onEdit={() => setEditingBill(bill)}
                                    onDelete={() => handleDelete(bill.id)}
                                    onStatusChange={(status) => handleStatusChange(bill, status)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {filteredBills.length === 0 && (
                <div className="text-center py-12">
                    <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {searchQuery ? `No bills found for "${searchQuery}"` : "No energy bills recorded"}
                    </p>
                </div>
            )}

            {/* Modals */}
            {isAddModalOpen && (
                <AddEnergyBillModal
                    onClose={() => setIsAddModalOpen(false)}
                />
            )}
            {editingBill && (
                <AddEnergyBillModal
                    bill={editingBill}
                    onClose={() => setEditingBill(null)}
                />
            )}
            {partialPaymentBill && (
                <PartialPaymentDialog
                    bill={partialPaymentBill}
                    onClose={() => setPartialPaymentBill(null)}
                />
            )}
        </div>
    );
}

function BillCard({
    bill,
    onEdit,
    onDelete,
    onStatusChange,
}: {
    bill: EnergyBill;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (status: PaymentStatus) => void;
}) {
    const { icon: Icon, color } = getTypeIconAndColor(bill.type);
    const isPending = bill.paymentStatus === PaymentStatus.Pending;
    const isPartial = bill.paymentStatus === PaymentStatus.PartialCash ||
        bill.paymentStatus === PaymentStatus.PartialOnline;
    const isPaid = bill.paymentStatus === PaymentStatus.PaidCash ||
        bill.paymentStatus === PaymentStatus.PaidOnline;

    const statusColor = isPaid ? "green" : isPartial ? "orange" : "red";

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-lg bg-${color}-100`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">
                        {getEnergyTypeDisplayName(bill.type)} - {bill.month} {bill.year}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Amount: Rs {bill.amount.toFixed(2)}
                    </p>
                    {isPartial && (
                        <div className="text-xs mt-1 space-y-0.5">
                            <p className="text-green-600 font-semibold">
                                Paid: Rs {bill.paidAmount.toFixed(2)}
                            </p>
                            <p className="text-orange-600 font-semibold">
                                Pending: Rs {calculateRemainingAmount(bill).toFixed(2)}
                            </p>
                        </div>
                    )}
                    {bill.remarks && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                            Note: {bill.remarks}
                        </p>
                    )}

                    {/* Status and Date */}
                    <div className="flex items-center gap-2 mt-2">
                        <PaymentStatusDropdown
                            currentStatus={bill.paymentStatus}
                            onChange={onStatusChange}
                            color={statusColor}
                        />
                        {bill.type === EnergyType.Gas && bill.purchaseDate && (
                            <span className="text-xs text-gray-500">
                                Purchased: {new Date(bill.purchaseDate).toLocaleDateString()}
                            </span>
                        )}
                        {bill.dueDate && bill.type !== EnergyType.Gas && (
                            <span className="text-xs text-gray-500">
                                Due: {new Date(bill.dueDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function PaymentStatusDropdown({
    currentStatus,
    onChange,
    color,
}: {
    currentStatus: PaymentStatus;
    onChange: (status: PaymentStatus) => void;
    color: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const colorClasses = {
        green: "bg-green-100 text-green-700 border-green-300",
        orange: "bg-orange-100 text-orange-700 border-orange-300",
        red: "bg-red-100 text-red-700 border-red-300",
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-2 py-1 text-xs font-bold rounded border ${colorClasses[color as keyof typeof colorClasses]} flex items-center gap-1`}
            >
                {getPaymentStatusDisplayName(currentStatus)}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button
                            onClick={() => {
                                onChange(PaymentStatus.Pending);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => {
                                onChange(PaymentStatus.PartialCash);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Partially Paid - Cash
                        </button>
                        <button
                            onClick={() => {
                                onChange(PaymentStatus.PartialOnline);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Partially Paid - Online
                        </button>
                        <hr className="my-1" />
                        <button
                            onClick={() => {
                                onChange(PaymentStatus.PaidCash);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Paid - Cash
                        </button>
                        <button
                            onClick={() => {
                                onChange(PaymentStatus.PaidOnline);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Paid - Online
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function getTypeIconAndColor(type: EnergyType) {
    switch (type) {
        case EnergyType.Electricity:
            return { icon: Zap, color: "orange" };
        case EnergyType.Water:
            return { icon: Droplet, color: "blue" };
        case EnergyType.Gas:
            return { icon: Flame, color: "red" };
        case EnergyType.Food:
            return { icon: UtensilsCrossed, color: "green" };
        default:
            return { icon: Zap, color: "gray" };
    }
}
