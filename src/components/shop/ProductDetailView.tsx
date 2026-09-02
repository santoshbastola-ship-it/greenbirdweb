"use client";

import { Product } from "@/types";
import { formatProductDescription } from "@/lib/text-helper";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import ShareButton from "@/components/ui/ShareButton";
import ProductQuantitySelector from "@/components/shop/ProductQuantitySelector";
import ProductImageGallery from "@/components/shop/ProductImageGallery";
import AdminProductControls from "@/components/admin/AdminProductControls";
import { calculateProductPrice } from "@/lib/product-helper";
import { useEffect, useState } from "react";
import { ProductService } from "@/services/product.service";
import Link from "next/link";

interface ProductDetailViewProps {
    product: Product;
    onBack?: () => void;
}

export default function ProductDetailView({ product: initialProduct, onBack }: ProductDetailViewProps) {
    const [product, setProduct] = useState<Product>(initialProduct);

    // Fetch fresh data on mount to handle static generation staleness
    useEffect(() => {
        let isMounted = true;
        const fetchFreshData = async () => {
            if (initialProduct.id) {
                try {
                    const freshData = await ProductService.getProductById(initialProduct.id);
                    // Only update if mounted and data is different/fresh
                    if (isMounted && freshData) {
                        console.log("[ProductDetailView] Fetched fresh data", freshData.id);
                        setProduct(prev => ({
                            ...prev,
                            ...freshData,
                            // Ensure images array is explicitly replaced
                            images: freshData.images || []
                        }));
                    }
                } catch (error) {
                    console.error("Failed to refresh product data", error);
                }
            }
        };
        fetchFreshData();
        return () => { isMounted = false; };
    }, [initialProduct.id]);

    const { finalPrice, originalPrice, hasDiscount, discountBadge } = calculateProductPrice(product);

    return (
        <div className="w-full">
            {onBack ? (
                <button
                    onClick={onBack}
                    className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-[#2D5A27] dark:hover:text-green-400 mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shop
                </button>
            ) : (
                <Link
                    href="/shop"
                    className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-[#2D5A27] dark:hover:text-green-400 mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shop
                </Link>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100/50 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">

                    {/* Image Section */}
                    <div className="relative group overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <ProductImageGallery
                            // Force re-render when image count or first image changes
                            key={`${product.id}-${product.images?.length || 0}-${product.images?.[0] || 'no-img'}`}
                            images={product.images}
                            productName={product.name}
                        />
                        {/* Tags Overlay */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                                {product.tags.map((tag, index) => (
                                    <span key={index} className="bg-white/95 dark:bg-gray-900/95 text-[#2D5A27] dark:text-green-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md border border-[#2D5A27]/20 dark:border-green-500/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center space-x-2 mb-4">
                            {product.isAvailableForSale ? (
                                <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Available
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Not Available
                                </span>
                            )}
                        </div>

                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                            <ShareButton
                                title={product.name}
                                text={`Check out ${product.name} at Greenbird Homestead!`}
                            />
                            <AdminProductControls productId={product.id} />
                        </div>

                        <div className="flex flex-col mb-6">
                            <div className="flex items-baseline">
                                <span className="text-3xl font-bold text-[#2D5A27] dark:text-green-400">Rs. {finalPrice}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">/ {product.priceUnit || product.unit}</span>
                                {hasDiscount && (
                                    <span className="ml-4 text-xl text-gray-400 dark:text-gray-600 line-through">
                                        Rs. {originalPrice}
                                    </span>
                                )}
                            </div>
                            {hasDiscount && (
                                <div className="mt-2">
                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                                        {discountBadge}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Quantity & Add to Cart */}
                        <div className="mb-8">
                            <ProductQuantitySelector product={product} />
                        </div>

                        <div className="prose prose-green dark:prose-invert mb-8 text-gray-600 dark:text-gray-300">
                            <div className="text-sm leading-relaxed">
                                {formatProductDescription(product.description || "No description available for this product.")}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                            <ShieldCheck className="h-4 w-4 mr-2 text-[#2D5A27] dark:text-green-400" />
                            <span>Secure checkout & farm-fresh guarantee</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
