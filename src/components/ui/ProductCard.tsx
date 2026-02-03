import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import AddToCartButton from "./AddToCartButton";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const hasStock = product.currentStock > 0;

    // Fallback image if none provided
    const imageSrc = product.images.length > 0 ? product.images[0] : "/placeholder.png";

    return (
        <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
            <Link href={`/shop/${product.id}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-100">
                <div className="w-full h-full relative">
                    <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                </div>
                {!hasStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Out of Stock
                        </span>
                    </div>
                )}
            </Link>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs text-[#2D5A27] font-semibold mb-1 uppercase tracking-wider">
                            {product.businessType}
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

                <div className="flex items-center justify-between mt-4">
                    {/* Rating placeholder */}
                    <div className="flex items-center text-yellow-400 text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="ml-1 text-gray-500">4.8</span>
                    </div>

                    <AddToCartButton product={product} />
                </div>
            </div>
        </div>
    );
}
