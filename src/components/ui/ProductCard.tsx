import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import AddToCartButton from "./AddToCartButton";
import { useAuth } from "@/context/AuthContext";
import ShareButton from "./ShareButton";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { dbUser } = useAuth();
    const isAvailable = product.isAvailableForSale;
    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';

    // Fallback image if none provided
    const imageSrc = (product.images && Array.isArray(product.images) && product.images.length > 0)
        ? product.images[0]
        : "/placeholder.png";

    return (
        <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 relative">
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Link href={`/shop/${product.id}`} className="block w-full h-full">
                    <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                </Link>

                {/* Share Button - Positioned absolutely but outside the Link */}
                <div className="absolute top-2 right-2 z-30">
                    <ShareButton
                        title={product.name}
                        text={`Check out ${product.name} at Greenbird Homestead!`}
                        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${product.id}`}
                        className="scale-90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300"
                    />
                </div>

                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Out of Stock
                        </span>
                    </div>
                )}
                {product.tags && product.tags.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20 pointer-events-none">
                        {product.tags.map((tag, index) => (
                            <span key={index} className="bg-white/90 text-[#2D5A27] px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm border border-[#2D5A27]/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs text-[#2D5A27] font-semibold mb-1 uppercase tracking-wider">
                            {product.categoryName || (isAdminOrManager ? product.businessType : "")}
                        </p>
                        <Link href={`/shop/${product.id}`}>
                            <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-[#2D5A27] transition-colors">
                                {product.name}
                            </h3>
                        </Link>
                    </div>
                    <div className="flex items-center bg-[#2D5A27]/10 px-3 py-1.5 rounded-xl border border-[#2D5A27]/10 shadow-sm">
                        <span className="text-sm font-bold text-[#2D5A27]">
                            Rs. {product.currentPrice}
                        </span>
                        <span className="text-xs text-[#2D5A27]/70 ml-1">/{product.priceUnit}</span>
                    </div>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <AddToCartButton product={product} />
                </div>
            </div>
        </div>
    );
}
