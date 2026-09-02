"use client";

import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import OrderSuccessMessage from "@/components/ui/OrderSuccessMessage";
import Link from "next/link";
import Image from "next/image";
import { Product, Category } from "@/types";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProductService } from "@/services/product.service";
import ProductDetailView from "./ProductDetailView";
import { useRouter } from "next/navigation";
import { Sprout, ShoppingBag, Bird } from "lucide-react";

import CategoryFilter from "./CategoryFilter";

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

    // Helper to check if a product is inactive or hidden
    const isProductInactiveOrHidden = (p: Product) => {
        const isInactive = p.isActive === false || (p as any).isActive === 'false' || (p as any).status === 'inactive';
        const isHidden = p.showInApp === false || (p as any).showInApp === 'false';
        const isAsset = p.businessType === 'asset';
        return isInactive || isHidden || isAsset;
    };

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

    const isProduceCategory = categoryId === 'produce' || categoryId === 'crop' || categoryId === 'livestock' || categoryId === 'farm-produce';

    const products = allProducts.filter(p => {
        // If we want to view a specific product via query param
        if (viewId) {
            return p.id === viewId;
        }

        // Filter by category or businessType if present
        if (categoryId) {
            const catLower = categoryId.toLowerCase();
            const matchesCategory = p.categoryId === categoryId;
            const matchesBusinessType = p.businessType?.toLowerCase() === catLower;
            const matchesCategoryAlias = 
                (catLower === 'produce' || catLower === 'farm-produce') && 
                (p.businessType === 'crop' || p.businessType === 'livestock' || p.categoryName?.toLowerCase().includes('produce') || p.categoryName?.toLowerCase().includes('chicken') || p.categoryName?.toLowerCase().includes('egg'));

            if (!matchesCategory && !matchesBusinessType && !matchesCategoryAlias) return false;
        }

        // Filter by search term if present
        if (search) {
            const matchesSearch =
                p.name.toLowerCase().includes(search) ||
                p.description?.toLowerCase().includes(search) ||
                p.categoryName?.toLowerCase().includes(search);
            if (!matchesSearch) return false;
        }

        // Strictly hide inactive, hidden, and asset products from public shop for ALL users (including admins)
        if (isProductInactiveOrHidden(p)) {
            return false;
        }

        return true;
    });

    const categoryDisplayName = categoryId
        ? (isProduceCategory 
            ? 'Farm Produce & Free-Range Poultry' 
            : categories.find(c => c.id === categoryId)?.name ||
              products.find(p => p.categoryId === categoryId || p.businessType === categoryId)?.categoryName ||
              categoryId.charAt(0).toUpperCase() + categoryId.slice(1))
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

            {/* Shop Top Hero Banner Image - Rendered FIRST at the top of the shop */}
            <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="relative h-64 sm:h-72 w-full">
                    <Image
                        src={isProduceCategory ? "/images/farm-produce-banner.jpg" : "/images/vermicompost-banner.jpg"}
                        alt={isProduceCategory ? "Farm Produce & Free-Range Poultry" : "Vermicompost & Garden Marketplace"}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
                    <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center max-w-xl text-white">
                        <span className="inline-flex items-center gap-1.5 bg-[#2D5A27] text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 w-fit shadow-md">
                            {isProduceCategory ? <Bird className="w-3.5 h-3.5" /> : <Sprout className="w-3.5 h-3.5" />}
                            {isProduceCategory ? "100% Organic & Free-Range" : "Certified Organic Soil & Inputs"}
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
                            {isProduceCategory ? "Farm Produce & Pasture Poultry" : "Vermicompost & Garden Marketplace"}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-normal">
                            {isProduceCategory 
                                ? "Fresh seasonal vegetables harvested daily, 180-day pasture-raised local country chicken (Bhale), and fresh nutrient-rich farm eggs."
                                : "Proprietary 90-day cured organic castings, live Eisenia fetida breeding wrigglers, breathable grow bags, handcraft tools, and natural biopesticides."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Filter Selection - Rendered SECOND (After Banner Image) */}
            <div className="mb-8">
                <CategoryFilter categories={categories} />
            </div>

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
