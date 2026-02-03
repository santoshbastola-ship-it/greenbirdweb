import Link from 'next/link';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Product } from '@/types';
import { ShoppingCart, Package } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={() => addItem(product, 1)}
                    />
                ))}
            </div>
        </div>
    );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
    return (
        <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
            <Link href={`/shop/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
                {product.images?.[0] ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="h-10 w-10" />
                    </div>
                )}

                {product.currentStock <= 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                            Out of Stock
                        </span>
                    </div>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-1">
                <Link href={`/shop/${product.id}`} className="block">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-green-600 transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 capitalize">{product.businessType}</p>
                </Link>

                <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-gray-900">
                        Rs. {product.currentPrice.toLocaleString()}
                        <span className="text-xs text-gray-500 font-normal ml-1">/ {product.unit}</span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onAdd();
                        }}
                        disabled={product.currentStock <= 0}
                        className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add to Cart"
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
