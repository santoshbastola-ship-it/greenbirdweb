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

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setIsOpen(!isOpen);
                }}
                disabled={disabled}
                className={`px-2 py-1 text-xs font-bold rounded border ${selectedColorClass} flex items-center gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                {getPaymentStatusDisplayNameHelper(currentStatus)}
                {!disabled && <ChevronDown className="h-3 w-3" />}
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }} />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(PaymentStatus.Pending);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50"
                        >
                            Pending
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(PaymentStatus.PartialCash);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Partially Paid - Cash
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(PaymentStatus.PartialOnline);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50"
                        >
                            Partially Paid - Online
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(PaymentStatus.PaidCash);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Paid - Cash
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
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
