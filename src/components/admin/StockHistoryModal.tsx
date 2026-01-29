"use client";

import { X } from "lucide-react";
import { Product, StockHistoryEntry } from "@/types";
import { toNepali, formatDateTime } from "@/lib/date-helper";

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
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Stock History</h2>
                        <p className="text-sm text-gray-500">{product.name} ({product.unit})</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-auto p-0 flex-1">
                    {sortedHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No stock history available.
                        </div>
                    ) : (
                        <div className="min-w-full inline-block align-middle">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Date</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Action</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Change</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Remaining</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Note</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Updated By</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {sortedHistory.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {formatDateTime(entry.date)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getActionColor(entry.actionType)}`}>
                                                    {getActionLabel(entry.actionType)}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${entry.changeAmount > 0 ? 'text-green-600' : entry.changeAmount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                {entry.changeAmount > 0 ? '+' : ''}{entry.changeAmount}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                                {entry.newStock}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={entry.note || ""}>
                                                {entry.note || "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {entry.changedBy || "admin"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-gray-50 shrink-0 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
