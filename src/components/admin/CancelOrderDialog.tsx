import { useState } from "react";
import { TransactionRecord, OrderStatus } from "@/types";

export default function CancelOrderDialog({
    transaction,
    onClose,
    onConfirm,
}: {
    transaction: TransactionRecord;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) {
            alert("Cancellation reason is required");
            return;
        }
        onConfirm(reason.trim());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Transaction</h3>
                <p className="text-gray-600 mb-4">
                    Are you sure you want to cancel <span className="font-semibold">{transaction.billNo}</span>?
                </p>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                        rows={3}
                        placeholder="Enter reason for cancellation..."
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                        Confirm Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
