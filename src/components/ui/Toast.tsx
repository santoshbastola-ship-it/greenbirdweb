import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        // Using white background with colored border/icon for a clean look
        return "bg-white border-l-4";
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return "border-green-500";
            case 'error': return "border-red-500";
            default: return "border-blue-500";
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 shadow-lg rounded-lg p-4 flex items-center space-x-3 min-w-[300px] border ${getBgColor()} ${getBorderColor()}`}>
            {getIcon()}
            <p className="flex-1 text-sm font-medium text-gray-800">{message}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};
