"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { TransactionRecord, PaymentStatus, PaymentRecord } from "@/types";
import { TransactionService } from "@/services/transaction.service";
import { useAuth } from "@/context/AuthContext";

interface OrderPartialPaymentDialogProps {
    order: TransactionRecord;
    onClose: () => void;
    onSuccess: (amount?: number) => void;
}

export default function OrderPartialPaymentDialog({ order, onClose, onSuccess }: OrderPartialPaymentDialogProps) {
    const { dbUser } = useAuth();
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const totalOrderAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0) - (order.discount || 0) + (order.deliveryFee || 0);
    const remainingAmount = totalOrderAmount - (order.paidAmount || 0);

    // Determine payment type based on the status we are transitioning to (or passed as context?)
    // Actually the dialog should probably know what method we are trying to pay with, OR we just let user decide or assume based on status.
    // In Energy Bills, the status is passed contextually via the state logic in the parent.
    // Let's assume this dialog is triggered when user selects "Partial".
    // But which partial? Cash or Online?
    // Let's check Energy Bills logic. It uses `bill.paymentStatus` to detect if we are aiming for online/cash IF it was already partial.
    // But if we are transitioning FROM Pending TO Partial, we need to know which one.
    // Energy bills sets `setPartialPaymentBill(bill)` but doesn't seem to pass "target status".
    // Looking at PartialPaymentDialog in Energy: `const isOnline = bill.paymentStatus === PaymentStatus.PartialOnline;`
    // This implies it relies on the *current* status on the bill object?
    // Wait, in `handleStatusChange`: `if (newStatus === ...Partial...) { setPartialPaymentBill(bill); }`
    // It doesn't update the bill status before opening dialog. So `bill.paymentStatus` is still `Pending` (or whatever it was).
    // So `isOnline` check in PartialPaymentDialog might be using the OLD status?
    // Actually, `paymentMethod = isOnline ? "Online" : "Cash"`.
    // If I'm Pending and click "Partial Online", `bill.paymentStatus` is Pending. `isOnline` is false. Default to Cash.
    // This seems like a bug or I misunderstood the Energy implementation.
    // Let's look at `EnergyBillsPage.tsx` again.
    // `const handleStatusChange = async (bill: EnergyBill, newStatus: PaymentStatus) => { ... if (newStatus === ...Partial...) { setPartialPaymentBill(bill); return; }`
    // It sets the bill into state. The bill object hasn't changed.
    // Then `PartialPaymentDialog` renders with `bill`.
    // `const isOnline = bill.paymentStatus === PaymentStatus.PartialOnline;`
    // If I was Pending, `isOnline` is false.
    // So even if I clicked "Partial Online", the dialog thinks it's Cash?
    // That seems generic.
    // For OrderPartialPaymentDialog, I'll add a `targetStatus` prop or just a radio button/selector for Cash/Online to be explicit.
    // OR I can just pass `initialPaymentMethod` prop.

    // Let's add `paymentMethod` selector in the dialog to be safe and clear.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        if (paymentAmount > remainingAmount + 1) { // Allow slight floating point tolerance
            alert("Payment amount cannot exceed remaining amount");
            return;
        }

        setLoading(true);

        try {
            const newTotalPaid = (order.paidAmount || 0) + paymentAmount;

            // Determine final status
            // If we have a payment method selector, use that.
            // For now let's infer or default to Cash if not specified, but let's add a selector.

            // Wait, if I use the Dropdown to select "Partial Online", I expect it to be Online.
            // So the parent should pass the desired status.

            // Let's update `OrderPartialPaymentDialogProps` to accept `targetStatus`.
            // But if we want to change method inside dialog, we can.

            // I'll stick to a simple dropdown in the dialog for Method: Cash / Online.

            const paymentMethodSelect = (document.querySelector('select[name="paymentMethod"]') as HTMLSelectElement)?.value || "Cash";
            const isOnlinePayment = paymentMethodSelect === "Online";

            let finalStatus: PaymentStatus;

            if (newTotalPaid >= totalOrderAmount - 1) {
                finalStatus = isOnlinePayment ? PaymentStatus.PaidOnline : PaymentStatus.PaidCash;
            } else {
                finalStatus = isOnlinePayment ? PaymentStatus.PartialOnline : PaymentStatus.PartialCash;
            }

            const newPayments = [...(order.payments || []), {
                amount: paymentAmount,
                date: new Date(),
                note: note || `Partial Payment - ${paymentMethodSelect}`
            }];

            await TransactionService.updatePaymentStatus(
                order.id,
                finalStatus,
                newTotalPaid,
                newPayments,
                dbUser?.name || "Admin"
            );

            onSuccess(paymentAmount);
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
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold">Rs {totalOrderAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Already Paid:</span>
                            <span className="font-semibold text-green-600">Rs {(order.paidAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-900 font-medium">Remaining:</span>
                            <span className="font-bold text-orange-600">Rs {remainingAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                        </label>
                        <select name="paymentMethod" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            <option value="Cash">Cash</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount Paying Now
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs</span>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Note (Optional)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Reason or reference..."
                        />
                    </div>

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
                                "Record Payment"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
