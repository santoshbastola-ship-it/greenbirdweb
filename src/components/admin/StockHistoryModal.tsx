"use client";

import { X } from "lucide-react";
import { Product, StockHistoryEntry } from "@/types";

interface StockHistoryModalProps {
    product: Product;
    onClose: () => void;
}

export default function StockHistoryModal({ product, onClose }: StockHistoryModalProps) {
    // Sort history by date descending (newest first)
    const sortedHistory = [...(product.stockHistory || [])].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getActionColor = (type: StockHistoryEntry['actionType']) => {
        switch (type) {
            case 'add': return 'text-green-600 bg-green-50';
            case 'initial': return 'text-green-600 bg-green-50';
            case 'purchase': return 'text-green-600 bg-green-50';
            case 'remove': return 'text-red-600 bg-red-50';
            case 'sale': return 'text-red-600 bg-red-50';
            case 'set': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getActionLabel = (type: StockHistoryEntry['actionType']) => {
        switch (type) {
            case 'add': return 'Added';
            case 'initial': return 'Initial';
            case 'purchase': return 'Purchased';
            case 'remove': return 'Removed';
            case 'sale': return 'Sold';
            case 'set': return 'Set to';
            default: return type;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Stock History</h2>
                        <p className="text-sm text-gray-500">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 flex-1">
                    {sortedHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No stock history available.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedHistory.map((entry) => (
                                <div key={entry.id} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className={`p-2 rounded-lg mr-4 ${getActionColor(entry.actionType)}`}>
                                        <span className="text-xs font-bold uppercase">{getActionLabel(entry.actionType)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {entry.note || "No details provided"}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(entry.date).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-bold ${entry.changeAmount > 0 ? 'text-green-600' : entry.changeAmount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {entry.changeAmount > 0 ? '+' : ''}{entry.changeAmount} {product.unit}
                                                </p>
                                                <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-end space-x-1">
                                                    <span>{entry.oldStock}</span>
                                                    <span>→</span>
                                                    <span className="font-semibold">{entry.newStock}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
