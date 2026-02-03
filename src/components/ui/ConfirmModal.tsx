"use client";

import React from "react";
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: AlertCircle,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            confirmBtn: "bg-red-600 hover:bg-red-700 shadow-red-200",
        },
        warning: {
            icon: AlertTriangle,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            confirmBtn: "bg-orange-600 hover:bg-orange-700 shadow-orange-200",
        },
        info: {
            icon: Info,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            confirmBtn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
        },
        success: {
            icon: CheckCircle,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            confirmBtn: "bg-green-600 hover:bg-green-700 shadow-green-200",
        },
    };

    const styles = variantStyles[variant];
    const Icon = styles.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center border border-gray-100 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className={`mx-auto w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className={`w-8 h-8 ${styles.iconColor}`} />
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                    {message}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`w-full py-4 px-6 ${styles.confirmBtn} text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center disabled:opacity-70`}
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}
