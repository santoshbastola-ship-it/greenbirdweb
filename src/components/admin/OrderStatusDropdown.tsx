import { useState } from "react";
import { OrderStatus } from "@/types";
import { ChevronDown } from "lucide-react";

interface OrderStatusDropdownProps {
    currentStatus: OrderStatus;
    onStatusChange: (status: OrderStatus) => void;
    isUpdating: boolean;
    onCancelClick: () => void;
}

export default function OrderStatusDropdown({
    currentStatus,
    onStatusChange,
    isUpdating,
    onCancelClick,
}: OrderStatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Open: return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
            case OrderStatus.Accepted: return { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" };
            case OrderStatus.Delivered: return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
            case OrderStatus.Cancelled: return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
            default: return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
        }
    };

    const colors = getStatusColor(currentStatus);
    const statuses = [OrderStatus.Open, OrderStatus.Accepted, OrderStatus.Delivered, OrderStatus.Cancelled];
    const isCancelled = currentStatus === OrderStatus.Cancelled;

    return (
        <div className={`relative ${isOpen ? 'z-40' : 'z-0'}`}>
            <button
                onClick={() => !isCancelled && setIsOpen(!isOpen)}
                disabled={isUpdating || isCancelled}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-sm transition-all ${colors.bg} ${colors.text} ${colors.border} ${isCancelled ? 'cursor-not-allowed opacity-75' : 'hover:opacity-80'} disabled:opacity-50`}
                title={isCancelled ? "Cancelled orders cannot be modified" : ""}
            >
                <span>{currentStatus}</span>
                {!isCancelled && <ChevronDown className="h-4 w-4" />}
            </button>

            {isOpen && !isCancelled && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 md:left-auto right-auto md:right-0 bottom-full mb-1 md:bottom-auto md:top-full md:mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        {statuses.map((status) => {
                            const statusColors = getStatusColor(status);
                            return (
                                <button
                                    key={status}
                                    onClick={() => {
                                        if (status === OrderStatus.Cancelled) {
                                            onCancelClick();
                                        } else {
                                            onStatusChange(status);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${status === currentStatus ? "bg-gray-50" : ""
                                        }`}
                                >
                                    <div className={`h-3 w-3 rounded-full ${statusColors.bg} ${statusColors.border} border`} />
                                    <span className="text-sm font-medium text-gray-700">{status}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
