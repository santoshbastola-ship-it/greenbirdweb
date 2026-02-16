"use client";

import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import OrderSuccessMessage from "@/components/ui/OrderSuccessMessage";
import Link from "next/link";
import { Product, Category } from "@/types";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProductService } from "@/services/product.service";
import ProductDetailView from "./ProductDetailView";
import { useRouter } from "next/navigation";

interface ProductListContentProps {
    initialProducts: Product[];
    categories: Category[];
}

function ProductListContent({ initialProducts, categories }: ProductListContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { dbUser } = useAuth();
    const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
    const categoryId = searchParams.get('category');
    const viewId = searchParams.get('view');
    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';
    const search = searchParams.get('search')?.toLowerCase() || "";

    // Fetch fresh products on mount to ensure prices are up to date in static export
    useEffect(() => {
        const fetchFreshProducts = async () => {
            try {
                const freshProducts = await ProductService.getAllProducts();
                if (freshProducts && freshProducts.length > 0) {
                    setAllProducts(freshProducts);
                }
            } catch (error) {
                console.error("Error fetching fresh products:", error);
            }
        };
        fetchFreshProducts();
    }, []);

    const products = allProducts.filter(p => {
        // If we want to view a specific product via query param
        if (viewId) {
            return p.id === viewId;
        }

        // Filter by category if present
        // Filter by category if present
        if (categoryId) {
            const matchesCategory = p.categoryId === categoryId;
            const matchesBusinessType = p.businessType === categoryId;
            if (!matchesCategory && !matchesBusinessType) return false;
        }

        // Filter by search term if present
        if (search) {
            const matchesSearch =
                p.name.toLowerCase().includes(search) ||
                p.description?.toLowerCase().includes(search) ||
                p.categoryName?.toLowerCase().includes(search);
            if (!matchesSearch) return false;
        }

        // Hide assets from customers
        if (p.businessType === 'asset' && !isAdminOrManager) return false;

        // Hide hidden products from customers
        if (p.showInApp === false && !isAdminOrManager) return false;

        return true;
    });

    const categoryDisplayName = categoryId
        ? categories.find(c => c.id === categoryId)?.name ||
        products.find(p => p.categoryId === categoryId || p.businessType === categoryId)?.categoryName ||
        categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
        : 'All Products';

    const headerTitle = viewId
        ? allProducts.find(p => p.id === viewId)?.name || "Product Details"
        : search ? `Search Results for "${searchParams.get('search')}"` : categoryDisplayName;

    if (viewId) {
        const product = allProducts.find(p => p.id === viewId);
        if (product) {
            return (
                <div className="flex-1">
                    <ProductDetailView
                        product={product}
                        onBack={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete('view');
                            router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`);
                        }}
                    />
                </div>
            );
        }
    }

    return (
        <div className="flex-1">
            <OrderSuccessMessage />

            <div className="flex flex-col gap-2 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words flex-1 min-w-0">
                        {headerTitle}
                    </h1>
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{products.length} items</span>
                </div>
                <p className="text-base text-gray-800 dark:text-gray-200 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700/50 shadow-sm text-center">
                    <span className="font-bold text-yellow-700 dark:text-yellow-500">Note:</span> Item quantity can be set from the Checkout page.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        {searchParams.get('search')
                            ? `No products found matching "${searchParams.get('search')}"`
                            : "No products found in this category."}
                    </p>
                    <Link
                        href="/shop"
                        className="text-[#2D5A27] dark:text-green-400 font-medium hover:underline mt-2 inline-block"
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
