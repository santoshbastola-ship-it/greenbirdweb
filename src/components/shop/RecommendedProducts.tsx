import { useState } from 'react';
import Link from 'next/link';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Product } from '@/types';
import { Plus, Package, Check } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/context/AuthContext';
import ShareButton from '@/components/ui/ShareButton';
import { calculateProductPrice } from '@/lib/product-helper';

import { FRESH_EGGS_PRODUCT_ID } from '@/lib/constants';

export default function RecommendedProducts() {
    const { recommendations, loading } = useRecommendations();
    const { addItem } = useCartStore();

    if (loading) {
        return (
            <div className="mt-12">
                <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-64 animate-pulse">
                            <div className="h-32 bg-gray-100 rounded-lg mb-4"></div>
                            <div className="h-4 w-3/4 bg-gray-100 rounded mb-2"></div>
                            <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="mt-12 border-t border-gray-100 pt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">You might also like</h2>
            <div className="space-y-3">
                {recommendations.map((product) => {
                    const isEggs = product.id === FRESH_EGGS_PRODUCT_ID;
                    const quantity = isEggs ? 30 : 1;
                    return (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAdd={() => addItem(product, quantity)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
    const { dbUser } = useAuth();
    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        onAdd();
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    const { finalPrice } = calculateProductPrice(product);

    return (
        <div className="group bg-white rounded-xl border border-gray-100 p-3 md:p-4 hover:shadow-md transition-all duration-300 flex items-center gap-3 md:gap-4">
            {/* Product Image - Responsive sizing */}
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                <Link href={`/shop?view=${product.id}`} className="block w-full h-full overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                    {product.images?.[0] ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package className="h-6 w-6" />
                        </div>
                    )}
                </Link>

                {/* Share Button Overlay - Hidden on mobile */}
                <div className="absolute top-0 right-0 z-30 scale-75 origin-top-right hidden md:block">
                    <ShareButton
                        title={product.name}
                        text={`Check out ${product.name} at Greenbird Homestead!`}
                        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${product.id}`}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                    />
                </div>
            </div>

            {/* Product Details - Flexible layout */}
            <div className="flex-1 min-w-0">
                <Link href={`/shop?view=${product.id}`} className="block group/title">
                    {/* Product name - no truncation, wraps naturally */}
                    <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white line-clamp-2 group-hover/title:text-green-600 dark:group-hover/title:text-green-400 transition-colors leading-tight mb-1">
                        {product.name}
                    </h3>
                    {/* Category - only show on larger screens or for admin */}
                    {(product.categoryName || (isAdminOrManager && product.businessType)) && (
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 capitalize tracking-wide mb-1 hidden sm:block">
                            {product.categoryName || product.businessType}
                        </p>
                    )}
                </Link>

                {/* Price and unit on same line */}
                <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-sm md:text-base font-black text-green-700 dark:text-green-500 whitespace-nowrap">
                        Rs. {finalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">/ {product.unit}</span>
                </div>
            </div>

            {/* Add Button - Responsive sizing */}
            <div className="flex-shrink-0">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        handleAdd();
                    }}
                    disabled={product.currentStock <= 0 || isAdded}
                    className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm
                        ${isAdded
                            ? 'bg-green-600 text-white shadow-green-200 cursor-default'
                            : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:bg-green-600 dark:hover:text-white hover:shadow-md active:scale-95'
                        }
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    title={isAdded ? "Added!" : "Add to Cart"}
                >
                    {isAdded ? (
                        <Check className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                        <Plus className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
