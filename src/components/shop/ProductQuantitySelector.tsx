"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import AddToCartButton from "@/components/ui/AddToCartButton";
import { Product, Unit } from "@/types";
import { FRESH_EGGS_PRODUCT_ID } from "@/lib/constants";
import { UnitService } from "@/services/unit.service";
import { useEffect } from "react";

interface ProductQuantitySelectorProps {
    product: Product;
}

export default function ProductQuantitySelector({ product }: ProductQuantitySelectorProps) {
    const isEggs = product.id === FRESH_EGGS_PRODUCT_ID;
    const [quantity, setQuantity] = useState(isEggs ? 30 : 1);
    const [allowDecimals, setAllowDecimals] = useState(true);

    useEffect(() => {
        const fetchUnitInfo = async () => {
            try {
                const units = await UnitService.getActiveUnits();
                const unitToUse = product.priceUnit || product.unit;
                const unitInfo = units.find(u => u.name.toLowerCase() === unitToUse.toLowerCase());
                if (unitInfo) {
                    setAllowDecimals(unitInfo.allowDecimals !== false);
                }
            } catch (err) {
                console.error("Error fetching unit info:", err);
            }
        };
        fetchUnitInfo();
    }, [product.unit, product.priceUnit]);

    const handleIncrement = () => {
        const step = isEggs ? 30 : 1;
        setQuantity(prev => prev + step);
    };

    const handleDecrement = () => {
        const step = isEggs ? 30 : 1;
        setQuantity(prev => {
            const newVal = prev - step;
            return Math.max(0, allowDecimals ? newVal : Math.floor(newVal));
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setQuantity(0);
            return;
        }
        let parsed = parseFloat(value);
        if (!isNaN(parsed)) {
            if (!allowDecimals) {
                parsed = Math.floor(parsed);
            } else {
                // Round to 2 decimals if allowed
                parsed = Math.round(parsed * 100) / 100;
            }
            setQuantity(parsed);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all hover:border-[#2D5A27]/30 dark:hover:border-green-500/30">
                        <button
                            onClick={handleDecrement}
                            className="p-3 pl-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <input
                            type="number"
                            step={allowDecimals ? "0.01" : "1"}
                            min="0"
                            value={quantity}
                            onChange={handleInputChange}
                            className="w-14 text-center font-bold text-gray-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-0 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 h-10"
                            aria-label="Quantity"
                        />
                        <button
                            onClick={handleIncrement}
                            className="p-3 pr-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Unit</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-bold lowercase">{product.priceUnit || product.unit}</span>
                </div>
            </div>

            {/* Floating Add to Cart Button */}
            <div className="fixed bottom-0 left-0 right-0 z-[9000] p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AddToCartButton
                        product={product}
                        quantity={quantity}
                        fullWidth={true}
                        className="w-full bg-[#5C4033] dark:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#2D5A27] dark:hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5C4033]/20 dark:shadow-green-900/40"
                    />
                </div>
            </div>
        </div>
    );
}
