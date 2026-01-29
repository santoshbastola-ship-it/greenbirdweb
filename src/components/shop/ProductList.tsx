"use client";

import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import OrderSuccessMessage from "@/components/ui/OrderSuccessMessage";
import Link from "next/link";
import { Product } from "@/types";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";

interface ProductListContentProps {
    initialProducts: Product[];
}

function ProductListContent({ initialProducts }: ProductListContentProps) {
    const searchParams = useSearchParams();
    const { dbUser } = useAuth();
    const category = searchParams.get('category');

    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';

    const products = initialProducts.filter(p => {
        // First filter by category if present
        if (category && p.businessType !== category) return false;

        // Then hide assets from customers
        if (p.businessType === 'asset' && !isAdminOrManager) return false;

        return true;
    });

    return (
        <div className="flex-1">
            <OrderSuccessMessage />

            <div className="flex flex-col gap-2 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'All Products'}
                    </h1>
                    <span className="text-sm text-gray-500">{products.length} items</span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100">
                    <span className="font-semibold text-[#2D5A27]">Note:</span> Item quantity can be set from the Checkout page.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500 text-lg">No products found in this category.</p>
                    <Link
                        href="/shop"
                        className="text-[#2D5A27] font-medium hover:underline mt-2 inline-block"
                    >
                        View all products
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function ProductList(props: ProductListContentProps) {
    return (
        <Suspense fallback={<div>Loading products...</div>}>
            <ProductListContent {...props} />
        </Suspense>
    );
}
