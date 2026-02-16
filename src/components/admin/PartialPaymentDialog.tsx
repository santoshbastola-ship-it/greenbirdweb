"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { EnergyBill, PaymentStatus } from "@/types";
import { updatePaymentStatus, calculateRemainingAmount } from "@/services/energyService";

interface PartialPaymentDialogProps {
    bill: EnergyBill;
    onClose: () => void;
}

export default function PartialPaymentDialog({ bill, onClose }: PartialPaymentDialogProps) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const remainingAmount = calculateRemainingAmount(bill);

    // Determine payment method from current status or default to Cash
    const isOnline = bill.paymentStatus === PaymentStatus.PartialOnline;
    const paymentMethod = isOnline ? "Online" : "Cash";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        if (paymentAmount > remainingAmount + 1) {
            alert("Payment amount cannot exceed remaining amount");
            return;
        }

        setLoading(true);

        try {
            const newTotalPaid = bill.paidAmount + paymentAmount;
            let finalStatus: PaymentStatus;

            // If fully paid, upgrade to Paid status
            if (newTotalPaid >= bill.amount - 0.1) {
                finalStatus = isOnline ? PaymentStatus.PaidOnline : PaymentStatus.PaidCash;
            } else {
                finalStatus = isOnline ? PaymentStatus.PartialOnline : PaymentStatus.PartialCash;
            }

            await updatePaymentStatus(bill.id, finalStatus, newTotalPaid);
            onClose();
        } catch (error) {
            console.error("Error updating payment:", error);
            alert("Error updating payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        Add Partial Payment ({paymentMethod})
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Bill Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold">Rs {bill.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Already Paid:</span>
                            <span className="font-semibold text-green-600">Rs {bill.paidAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-900 font-medium">Remaining:</span>
                            <span className="font-bold text-orange-600">Rs {remainingAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount Paying Now
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                Rs
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                value={amount || ""}
                                onChange={(e) => setAmount(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                "Update Payment"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
