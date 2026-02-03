import { useState } from 'react';
import Link from 'next/link';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Product } from '@/types';
import { Plus, Package, Check } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/context/AuthContext';

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    const { dbUser } = useAuth();
    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        onAdd();
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-all duration-300 flex items-center gap-4">
            {/* Small Product Image */}
            <Link href={`/shop/${product.id}`} className="block relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
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

                )}

                {product.tags && product.tags.length > 0 && (
                    <div className="absolute top-1 left-1 flex flex-wrap gap-0.5 z-20">
                        {product.tags.map((tag, index) => (
                            <span key={index} className="bg-white/90 text-[#2D5A27] px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm border border-[#2D5A27]/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {product.currentStock <= 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center text-[8px] z-10">
                        <span className="bg-gray-900 text-white font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                            OOS
                        </span>
                    </div>
                )}
            </Link>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
                <Link href={`/shop/${product.id}`} className="block group/title">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover/title:text-green-600 transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-[10px] font-medium text-gray-400 capitalize tracking-wide">
                        {product.categoryName || (isAdminOrManager ? product.businessType : "")}
                    </p>
                </Link>

                <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-black text-green-700">
                        Rs. {product.currentPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">/ {product.unit}</span>
                </div>
            </div>

            {/* Add Button */}
            <div className="flex-shrink-0">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        handleAdd();
                    }}
                    disabled={product.currentStock <= 0 || isAdded}
                    className={`h-10 w-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm
                        ${isAdded
                            ? 'bg-green-600 text-white shadow-green-200 cursor-default'
                            : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white hover:shadow-md active:scale-95'
                        }
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    title={isAdded ? "Added!" : "Add to Cart"}
                >
                    {isAdded ? (
                        <Check className="h-5 w-5" />
                    ) : (
                        <Plus className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
