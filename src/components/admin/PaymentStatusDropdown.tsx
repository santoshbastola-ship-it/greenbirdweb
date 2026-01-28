import { useState } from "react";
import { PaymentStatus } from "@/types";
import { getPaymentStatusDisplayName } from "@/services/energyService"; // Or move this helper to a shared location?
// Actually payment status display name logic is simple, I can duplicate or move it. 
// For now, I will duplicate the simple helper function inside the component to avoid strict dependency on energyService if not needed, 
// OR better yet, let's see where getPaymentStatusDisplayName is used. It's in energyService.
// I'll stick to duplicating the helper logic or just importing it if it's exported. It is exported.

/* 
   However, energyService might be specific to energy. 
   Let's check if PaymentStatus enum is shared. Yes in types.
   I'll import the helper or redefine it to be safe and decoupled.
   Actually, redefine is cleaner for shared component.
*/

import { ChevronDown } from "lucide-react";

export function getPaymentStatusDisplayNameHelper(status: PaymentStatus): string {
    switch (status) {
        case PaymentStatus.Pending:
            return 'Pending';
        case PaymentStatus.PaidCash:
            return 'Paid - Cash';
        case PaymentStatus.PaidOnline:
            return 'Paid - Online';
        case PaymentStatus.PartialCash:
            return 'Partial - Cash';
        case PaymentStatus.PartialOnline:
            return 'Partial - Online';
        default:
            return status;
    }
}

interface PaymentStatusDropdownProps {
    currentStatus: PaymentStatus;
    onChange: (status: PaymentStatus) => void;
    color: string;
    disabled?: boolean;
}

export default function PaymentStatusDropdown({
    currentStatus,
    onChange,
    color,
    disabled = false
}: PaymentStatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const colorClasses: Record<string, string> = {
        green: "bg-green-100 text-green-700 border-green-300",
        orange: "bg-orange-100 text-orange-700 border-orange-300",
        red: "bg-red-100 text-red-700 border-red-300",
        gray: "bg-gray-100 text-gray-700 border-gray-300",
    };

    const selectedColorClass = colorClasses[color] || colorClasses.gray;

    // Helper to get dot color classes based on status
    const getStatusDotColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PaidCash:
            case PaymentStatus.PaidOnline:
                return "bg-green-100 border-green-200 border";
            case PaymentStatus.PartialCash:
            case PaymentStatus.PartialOnline:
                return "bg-orange-100 border-orange-200 border";
            case PaymentStatus.Pending:
                return "bg-red-100 border-red-200 border";
            default:
                return "bg-gray-100 border-gray-200 border";
        }
    };

    const paymentOptions = [
        { status: PaymentStatus.Pending, label: "Pending" },
        { status: PaymentStatus.PartialCash, label: "Partially Paid - Cash" },
        { status: PaymentStatus.PartialOnline, label: "Partially Paid - Online" },
        { status: PaymentStatus.PaidCash, label: "Paid - Cash" },
        { status: PaymentStatus.PaidOnline, label: "Paid - Online" },
    ];

    return (
        <div className={`relative ${isOpen ? 'z-40' : 'z-0'}`}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setIsOpen(!isOpen);
                }}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-sm transition-all ${selectedColorClass} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
            >
                <span>{getPaymentStatusDisplayNameHelper(currentStatus)}</span>
                {!disabled && <ChevronDown className="h-4 w-4" />}
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }} />
                    <div className="absolute left-0 md:left-auto right-auto md:right-0 bottom-full mb-1 md:bottom-auto md:top-full md:mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        {paymentOptions.map((option) => (
                            <button
                                key={option.status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(option.status);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${option.status === currentStatus ? "bg-gray-50" : ""}`}
                            >
                                <div className={`h-3 w-3 rounded-full ${getStatusDotColor(option.status)}`} />
                                <span className="text-sm font-medium text-gray-700">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
