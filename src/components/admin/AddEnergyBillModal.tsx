"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { EnergyBill, EnergyType, PaymentStatus } from "@/types";
import {
    addEnergyBill,
    updateEnergyBill,
    getEnergyTypeDisplayName,
    getPaymentStatusDisplayName,
    NEPALI_MONTHS
} from "@/services/energyService";
import { toNepali } from "@/lib/date-helper";
import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';
import NepaliDate from "nepali-date-converter";
import { cleanInput } from "@/lib/input-validation";
import DocumentUpload from "./DocumentUpload";

// Dynamic import for NepaliDatePicker to avoid SSR issues
const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
});

import "nepali-datepicker-reactjs/dist/index.css";

interface AddEnergyBillModalProps {
    bill?: EnergyBill;
    onClose: () => void;
}

export default function AddEnergyBillModal({ bill, onClose }: AddEnergyBillModalProps) {
    const isEditing = !!bill;
    const currentNepaliYear = new Date().getFullYear() + 57; // Rough BS year

    const { dbUser } = useAuth();

    // Helper function to convert AD Date to BS string
    const convertAdToBs = (date: Date | undefined): string => {
        if (!date) return "";
        try {
            return toNepali(date, "YYYY-MM-DD");
        } catch (e) {
            return "";
        }
    };

    const [formData, setFormData] = useState({
        type: bill?.type || EnergyType.Electricity,
        month: bill?.month || NEPALI_MONTHS[0],
        year: bill?.year || currentNepaliYear,
        amount: bill?.amount.toString() || "",
        paymentStatus: bill?.paymentStatus || PaymentStatus.Pending,
        paidAmount: bill?.paidAmount.toString() || "0",
        meterReadingDate: convertAdToBs(bill?.meterReadingDate),
        dueDate: convertAdToBs(bill?.dueDate),
        purchaseDate: convertAdToBs(bill?.purchaseDate),
        remarks: bill?.remarks || "",
        enteredBy: bill?.enteredBy || dbUser?.name || "Admin",
    });

    const [documentUrls, setDocumentUrls] = useState<string[]>(bill?.documentUrls || []);

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Helper function to convert BS date string to AD Date object
            const convertBsToAd = (bsDateString: string): Date | undefined => {
                if (!bsDateString) return undefined;
                try {
                    const nepaliDate = new NepaliDate(bsDateString);
                    return nepaliDate.toJsDate();
                } catch (e) {
                    console.error("Error converting BS to AD:", e);
                    return undefined;
                }
            };

            const billData: any = {
                type: formData.type,
                month: formData.month,
                year: formData.year,
                amount: parseFloat(formData.amount),
                paymentStatus: formData.paymentStatus,
                paidAmount: parseFloat(formData.paidAmount),
                remarks: formData.remarks.trim() || undefined,
                enteredBy: formData.enteredBy,
                entryDate: bill?.entryDate || new Date(),
                documentUrls: documentUrls,
            };

            // Add dates based on type - convert BS to AD
            if (formData.type === EnergyType.Gas && formData.purchaseDate) {
                billData.purchaseDate = convertBsToAd(formData.purchaseDate);
            } else if (formData.type !== EnergyType.Food) {
                if (formData.meterReadingDate) {
                    billData.meterReadingDate = convertBsToAd(formData.meterReadingDate);
                }
                if (formData.dueDate) {
                    billData.dueDate = convertBsToAd(formData.dueDate);
                }
            }

            if (isEditing) {
                await updateEnergyBill(bill.id, billData, dbUser?.name || "Admin");
            } else {
                await addEnergyBill(billData, dbUser?.name || "Admin");
            }

            onClose();
        } catch (error) {
            console.error("Error saving bill:", error);
            alert("Error saving bill. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const isPartialPayment = formData.paymentStatus === PaymentStatus.PartialCash ||
        formData.paymentStatus === PaymentStatus.PartialOnline;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? "Edit Energy Bill" : "Add Energy Bill"}
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
                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as EnergyType })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        >
                            {Object.values(EnergyType).map((type) => (
                                <option key={type} value={type}>
                                    {getEnergyTypeDisplayName(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month and Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bill Month (BS)
                            </label>
                            <select
                                value={formData.month}
                                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            >
                                {NEPALI_MONTHS.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year (BS)
                            </label>
                            <input
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (Rs)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Conditional Date Fields */}
                    {formData.type === EnergyType.Gas ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Purchase (BS)
                            </label>
                            <div className="nepali-datepicker-container">
                                <NepaliDatePicker
                                    value={formData.purchaseDate}
                                    onChange={(date: string) => setFormData({ ...formData, purchaseDate: date })}
                                    options={{ calenderLocale: "en", valueLocale: "en" }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            {formData.purchaseDate && (
                                <p className="text-xs text-gray-500 mt-1">Selected: {formData.purchaseDate}</p>
                            )}
                        </div>
                    ) : formData.type !== EnergyType.Food ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Meter Reading Date (BS)
                                </label>
                                <div className="nepali-datepicker-container">
                                    <NepaliDatePicker
                                        value={formData.meterReadingDate}
                                        onChange={(date: string) => setFormData({ ...formData, meterReadingDate: date })}
                                        options={{ calenderLocale: "en", valueLocale: "en" }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                {formData.meterReadingDate && (
                                    <p className="text-xs text-gray-500 mt-1">Selected: {formData.meterReadingDate}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due Date (BS)
                                </label>
                                <div className="nepali-datepicker-container">
                                    <NepaliDatePicker
                                        value={formData.dueDate}
                                        onChange={(date: string) => setFormData({ ...formData, dueDate: date })}
                                        options={{ calenderLocale: "en", valueLocale: "en" }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                {formData.dueDate && (
                                    <p className="text-xs text-gray-500 mt-1">Selected: {formData.dueDate}</p>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* Payment Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Status / Mode
                        </label>
                        <select
                            value={formData.paymentStatus}
                            onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        >
                            {Object.values(PaymentStatus).map((status) => (
                                <option key={status} value={status}>
                                    {getPaymentStatusDisplayName(status)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Paid Amount (for partial payments) */}
                    {isPartialPayment && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Paid Amount (Rs)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.paidAmount}
                                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Remaining will be calculated automatically
                            </p>
                        </div>
                    )}

                    {/* Remarks */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Remarks (Optional)
                        </label>
                        <textarea
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: cleanInput(e.target.value) })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Add any notes or comments"
                        />
                    </div>

                    {/* Document Upload */}
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bill Documents (Images/PDFs)
                        </label>
                        <DocumentUpload
                            documentUrls={documentUrls}
                            onChange={setDocumentUrls}
                            folder="energy-bills"
                        />
                    </div>


                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
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
                                    <span>Saving...</span>
                                </>
                            ) : (
                                "Save Bill"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
