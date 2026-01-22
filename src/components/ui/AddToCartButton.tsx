"use client";

import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/types";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

interface AddToCartButtonProps {
    product: Product;
    quantity?: number;
    className?: string; // Allow custom styling
    showIcon?: boolean;
    fullWidth?: boolean;
}

export default function AddToCartButton({
    product,
    quantity = 1,
    className,
    showIcon = true,
    fullWidth = false
}: AddToCartButtonProps) {
    const addItem = useCartStore((state) => state.addItem);
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation if inside a link
        addItem(product, quantity);

        // Visual feedback
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    const baseClasses = "flex items-center justify-center space-x-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const defaultClasses = "bg-[#5C4033] text-white px-3 py-2 rounded-lg text-xs hover:bg-[#2D5A27] shadow-sm active:scale-95 transition-all";

    if (className) {
        // If custom class provided, use it. This is a simplification. 
        // In a real app we might merge classes using clsx/tailwind-merge.
        return (
            <button
                onClick={handleAdd}
                disabled={product.currentStock <= 0}
                className={`${className} ${isAdded ? "!bg-[#2D5A27]" : "bg-[#5C4033]"} text-white transition-colors duration-300`}
            >
                {showIcon && <ShoppingBag className="h-4 w-4 mr-2" />}
                <span>{isAdded ? "Added!" : "Add to Cart"}</span>
            </button>
        )
    }

    // Default small button style (for cards)
    return (
        <button
            onClick={handleAdd}
            disabled={product.currentStock <= 0}
            className={`${baseClasses} ${defaultClasses} ${isAdded ? "!bg-[#2D5A27]" : ""}`}
        >
            {showIcon && <ShoppingBag className="h-3 w-3" />}
            <span>{isAdded ? "Added" : "Add"}</span>
        </button>
    );
}
