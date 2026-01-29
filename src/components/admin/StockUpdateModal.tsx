"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { Product } from "@/types";
import { ProductService } from "@/services/product.service";
import { useAuth } from "@/context/AuthContext";

interface StockUpdateModalProps {
    product: Product;
    onClose: () => void;
    onUpdate: () => void;
}

type ActionType = 'add' | 'remove' | 'set';

export default function StockUpdateModal({ product, onClose, onUpdate }: StockUpdateModalProps) {
    const [action, setAction] = useState<ActionType>('add');
    const [quantity, setQuantity] = useState<string>("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const { dbUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            alert("Please enter a valid quantity");
            return;
        }

        setLoading(true);
        try {
            await ProductService.updateProductStock(product.id, action, qty, note, dbUser?.name || "Unknown User");
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to update stock:", error);
            alert("Failed to update stock");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Update Stock</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{product.businessType}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Current Stock</p>
                            <p className="text-lg font-bold text-gray-900">
                                {product.currentStock} <span className="text-sm font-normal text-gray-500">{product.unit}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setAction('add')}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border ${action === 'add'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Add (+)
                            </button>
                            <button
                                type="button"
                                onClick={() => setAction('remove')}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border ${action === 'remove'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Remove (-)
                            </button>
                            <button
                                type="button"
                                onClick={() => setAction('set')}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border ${action === 'set'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Set to (=)
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {action === 'set' ? 'New Stock Quantity' : 'Quantity to ' + (action === 'add' ? 'Add' : 'Remove')}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                {product.unit}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note</label>
                        <textarea
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., New purchase, Damaged goods, Stock correction..."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? "Updating..." : "Update Stock"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
