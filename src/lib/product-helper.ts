import { Product } from "@/types";

export interface DiscountResult {
    originalPrice: number;
    finalPrice: number;
    discountAmount: number;
    hasDiscount: boolean;
    discountBadge: string | null;
}

export function calculateProductPrice(product: Product): DiscountResult {
    const { currentPrice, discount } = product;

    if (!discount || !discount.value) {
        return {
            originalPrice: currentPrice,
            finalPrice: currentPrice,
            discountAmount: 0,
            hasDiscount: false,
            discountBadge: null
        };
    }

    const now = new Date();

    // Check validity period
    if (discount.startDate && new Date(discount.startDate) > now) {
        return {
            originalPrice: currentPrice,
            finalPrice: currentPrice,
            discountAmount: 0,
            hasDiscount: false,
            discountBadge: null
        };
    }

    if (discount.endDate && new Date(discount.endDate) < now) {
        return {
            originalPrice: currentPrice,
            finalPrice: currentPrice,
            discountAmount: 0,
            hasDiscount: false,
            discountBadge: null
        };
    }

    // Calculate discount
    let finalPrice = currentPrice;
    let discountAmount = 0;
    let badge = "";

    if (discount.type === 'flat') {
        discountAmount = discount.value;
        finalPrice = Math.max(0, currentPrice - discount.value);
        badge = `Rs ${discount.value} OFF`;
    } else if (discount.type === 'percentage') {
        discountAmount = (currentPrice * discount.value) / 100;
        finalPrice = Math.max(0, currentPrice - discountAmount);
        badge = `${discount.value}% OFF`;
    }

    return {
        originalPrice: currentPrice,
        finalPrice: Math.round(finalPrice), // Round to nearest integer for clean display
        discountAmount: Math.round(discountAmount),
        hasDiscount: true,
        discountBadge: badge
    };
}
