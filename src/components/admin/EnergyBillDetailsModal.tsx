"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Edit2, Paperclip, ExternalLink } from "lucide-react";
import { EnergyBill, PaymentStatus } from "@/types";
import { toNepali } from "@/lib/date-helper";
import { updatePaymentStatus, getEnergyTypeDisplayName, calculateRemainingAmount, getPaymentStatusDisplayName } from "@/services/energyService";
import PaymentStatusDropdown from "@/components/admin/PaymentStatusDropdown";
import { useAuth } from "@/context/AuthContext";
import UserName from "@/components/ui/UserName";


export default function EnergyBillDetailsModal({
    bill,
    onClose,
    onUpdate,
    onEdit
}: {
    bill: EnergyBill;
    onClose: () => void;
    onUpdate: () => void;
    onEdit: () => void;
}) {
    const [currentBill, setCurrentBill] = useState<EnergyBill>(bill);
    const [isUpdating, setIsUpdating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
    const { dbUser } = useAuth();

    useEffect(() => {
        setCurrentBill(bill);
    }, [bill]);

    const remainingAmount = calculateRemainingAmount(currentBill);

    const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
        if (newStatus === currentBill.paymentStatus) return;

        setIsUpdating(true);
        try {
            let payAmount = currentBill.paidAmount;
            let payments = currentBill.payments || [];

            // If switching to Paid (Full), update paid amount to total amount
            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                payAmount = currentBill.amount;

                // Add a payment entry if previously there was a due amount
                const due = currentBill.amount - (currentBill.paidAmount || 0);
                if (due > 0) {
                    payments = [...payments, {
                        amount: due,
                        date: new Date(),
                        note: `Full Payment - ${newStatus === PaymentStatus.PaidOnline ? "Online" : "Cash"} (Status Update)`,
                        enteredBy: dbUser?.name || "Admin"
                    }];
                }
            }
            // If switching to Pending, reset paid amount to 0 (Caution: this might be destructive, but per requirement pending means not paid)
            else if (newStatus === PaymentStatus.Pending) {
                payAmount = 0; // Note: This doesn't clear history in DB unless service handles it, but local logic implies reset
            }
            // For Partial, we don't automatically change the paid amount, just the status. 
            // The user should record payments manually for partial.

            // Optimistic Update
            setCurrentBill(prev => ({
                ...prev,
                paymentStatus: newStatus,
                paidAmount: payAmount,
                payments: payments
            }));

            await updatePaymentStatus(currentBill.id, newStatus, payAmount, payments, dbUser?.name || "Admin");
            onUpdate();
        } catch (error) {
            console.error("Error updating payment status:", error);
            // Revert on error (optional, but good practice would be to re-fetch or revert)
            setCurrentBill(bill);
            alert("Failed to update payment status");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{getEnergyTypeDisplayName(currentBill.type)} Bill</h3>
                        <p className="text-sm text-gray-500">
                            {currentBill.month} {currentBill.year}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center"
                            title="Edit Details"
                        >
                            <Edit2 className="h-5 w-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Bill Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Details</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center h-8">
                                    <span className="text-gray-500">Amount:</span>
                                    <span className="font-bold text-gray-900">Rs. {currentBill.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Paid Amount:</span>
                                    <span className="font-medium text-green-600">Rs. {currentBill.paidAmount.toLocaleString()}</span>
                                </div>
                                {remainingAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Running Due:</span>
                                        <span className="font-bold text-orange-600">Rs. {remainingAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className={`font-medium ${(currentBill.paymentStatus === PaymentStatus.PaidCash || currentBill.paymentStatus === PaymentStatus.PaidOnline) ? "text-green-600" :
                                        (currentBill.paymentStatus === PaymentStatus.PartialCash || currentBill.paymentStatus === PaymentStatus.PartialOnline) ? "text-orange-600" : "text-red-600"
                                        }`}>
                                        {getPaymentStatusDisplayName(currentBill.paymentStatus)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center h-8">
                                    <span className="text-gray-500">Entered By:</span>
                                    <UserName nameOrId={currentBill.enteredBy} className="font-medium text-gray-900" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dates</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center min-h-[32px]">
                                    <span className="text-gray-500">Reading Date:</span>
                                    <span className="text-gray-900">{currentBill.meterReadingDate ? toNepali(currentBill.meterReadingDate, "DD MMM YYYY") : "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center min-h-[32px]">
                                    <span className="text-gray-500">Due Date:</span>
                                    <span className="text-gray-900">{currentBill.dueDate ? toNepali(currentBill.dueDate, "DD MMM YYYY") : "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center min-h-[32px]">
                                    <span className="text-gray-500">Entry Date:</span>
                                    <span className="text-gray-900">{currentBill.entryDate ? toNepali(currentBill.entryDate, "DD MMM YYYY") : "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remarks Section */}
                    {currentBill.remarks && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Remarks</h4>
                            <p className="text-sm text-gray-700 italic">"{currentBill.remarks}"</p>
                        </div>
                    )}

                    {/* Documents Section */}
                    {currentBill.documentUrls && currentBill.documentUrls.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Paperclip className="h-3 w-3" /> Bill Documents
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {currentBill.documentUrls.map((url, idx) => (
                                    <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:border-green-200 transition-all shadow-sm"
                                    >
                                        <img
                                            src={url}
                                            alt={`Document ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ExternalLink className="h-5 w-5 text-white" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment History */}
                    {currentBill.payments && currentBill.payments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment History</h4>
                            <div className="space-y-2">
                                {currentBill.payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                                                <CreditCard className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">
                                                    {toNepali(p.date, "DD MMM YYYY")} at {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {p.enteredBy && <span className="block text-[10px] text-gray-400">Updated by: <UserName nameOrId={p.enteredBy} /></span>}
                                                </p>
                                            </div>
                                        </div>
                                        {p.note && <span className="text-xs text-gray-400 italic">"{p.note}"</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Update Section */}
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-900">Payment Status</h4>
                            <PaymentStatusDropdown
                                currentStatus={currentBill.paymentStatus}
                                onChange={handlePaymentStatusChange}
                                isUpdating={isUpdating}
                                color={
                                    (currentBill.paymentStatus === PaymentStatus.PaidCash || currentBill.paymentStatus === PaymentStatus.PaidOnline) ? "green" :
                                        (currentBill.paymentStatus === PaymentStatus.PartialCash || currentBill.paymentStatus === PaymentStatus.PartialOnline) ? "orange" : "red"
                                }
                            />
                        </div>

                        {/* Manual Payment Entry Section */}
                        {currentBill.paymentStatus !== PaymentStatus.PaidCash && currentBill.paymentStatus !== PaymentStatus.PaidOnline && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-green-800">Record Payment</h4>
                                    {remainingAmount > 0 && (
                                        <span className="text-xs font-bold text-orange-600 bg-white px-2 py-1 rounded-md border border-orange-200">
                                            Due: Rs. {remainingAmount.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'Cash'}
                                            onChange={() => setPaymentMethod('Cash')}
                                            className="text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700">Cash</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'Online'}
                                            onChange={() => setPaymentMethod('Online')}
                                            className="text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700">Online</span>
                                    </label>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        id="paymentAmount"
                                        className="flex-1 px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Note"
                                        id="paymentNote"
                                        className="flex-[2] px-3 py-2 border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                    />
                                    <button
                                        onClick={async () => {
                                            const amountInput = document.getElementById('paymentAmount') as HTMLInputElement;
                                            const noteInput = document.getElementById('paymentNote') as HTMLInputElement;
                                            const amount = parseFloat(amountInput.value);

                                            if (isNaN(amount) || amount <= 0) {
                                                alert("Please enter a valid amount");
                                                return;
                                            }

                                            const newPaidAmount = (currentBill.paidAmount || 0) + amount;
                                            const newPayments = [...(currentBill.payments || []), {
                                                amount,
                                                date: new Date(),
                                                note: noteInput.value || `${paymentMethod} Payment`,
                                                enteredBy: dbUser?.name || "Admin"
                                            }];

                                            // Simple logic: if fully paid, mark as paid. Else partial.
                                            let newStatus = currentBill.paymentStatus;

                                            if (newPaidAmount >= currentBill.amount) {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PaidOnline : PaymentStatus.PaidCash;
                                            } else {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PartialOnline : PaymentStatus.PartialCash;
                                            }

                                            const finalPaidAmount = Math.min(newPaidAmount, currentBill.amount);

                                            try {
                                                // Optimistic update
                                                setCurrentBill(prev => ({
                                                    ...prev,
                                                    paidAmount: finalPaidAmount,
                                                    paymentStatus: newStatus,
                                                    payments: newPayments
                                                }));

                                                // Update Backend
                                                await updatePaymentStatus(currentBill.id, newStatus, finalPaidAmount, newPayments, dbUser?.name || "Admin");

                                                onUpdate();
                                                amountInput.value = "";
                                                noteInput.value = "";
                                            } catch (error) {
                                                console.error("Error updating payment:", error);
                                                setCurrentBill(bill); // Revert
                                                alert("Failed to record payment");
                                            }
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm text-sm"
                                    >
                                        Record Payment
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div >
    );
}
