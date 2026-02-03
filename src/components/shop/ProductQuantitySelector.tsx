"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import AddToCartButton from "@/components/ui/AddToCartButton";
import { Product } from "@/types";

interface ProductQuantitySelectorProps {
    product: Product;
}

export default function ProductQuantitySelector({ product }: ProductQuantitySelectorProps) {
    const isEggs = product.name.toLowerCase().includes('egg');
    const [quantity, setQuantity] = useState(isEggs ? 30 : 1);

    const handleIncrement = () => {
        const step = isEggs ? 30 : 1;
        setQuantity(prev => prev + step);
    };

    const handleDecrement = () => {
        const step = isEggs ? 30 : 1;
        setQuantity(prev => Math.max(0, prev - step));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setQuantity(0);
            return;
        }
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
            // Round to 2 decimals if needed
            const rounded = Math.round(parsed * 100) / 100;
            setQuantity(rounded);
        }
    };

    return (
        <div className="border-t border-gray-100 pt-8 mt-auto">
            <div className="flex items-center space-x-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                            onClick={handleDecrement}
                            className="p-3 hover:bg-gray-50 text-gray-500 transition-colors"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={quantity}
                            onChange={handleInputChange}
                            className="w-16 text-center font-bold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 h-10"
                            aria-label="Quantity"
                        />
                        <button
                            onClick={handleIncrement}
                            className="p-3 hover:bg-gray-50 text-gray-500 transition-colors"
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <span className="text-xs text-gray-500 lowercase font-bold">{product.unit}</span>
                </div>
                <div className="text-sm text-gray-500">
                    Quality Guaranteed
                </div>
            </div>

            <AddToCartButton
                product={product}
                quantity={quantity}
                fullWidth={true}
                className="w-full bg-[#5C4033] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2D5A27] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            />
        </div>
    );
}
