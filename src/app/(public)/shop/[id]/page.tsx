import { ProductService } from "@/services/product.service";
import { formatProductDescription } from "@/lib/text-helper";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButton from "@/components/ui/ShareButton";
import ProductQuantitySelector from "@/components/shop/ProductQuantitySelector";
import ProductImageGallery from "@/components/shop/ProductImageGallery";

interface PageProps {
    params: Promise<{ id: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
    return [{ id: 'placeholder' }];
}

export default async function ProductDetailsPage({ params }: PageProps) {
    const { id } = await params;

    // Handle placeholder for build time
    if (id === 'placeholder') {
        return <div className="min-h-screen bg-[#FCF9F1] py-12 flex items-center justify-center font-bold text-2xl">Loading Product Details...</div>;
    }

    const product = await ProductService.getProductById(id);

    if (!product) {
        notFound();
    }

    const hasStock = product.currentStock > 0;

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-12 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/shop" className="inline-flex items-center text-gray-500 hover:text-[#2D5A27] mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shop
                </Link>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2">

                        {/* Image Section */}
                        <div className="relative group overflow-hidden">
                            <ProductImageGallery
                                images={product.images}
                                productName={product.name}
                            />
                            {/* Tags Overlay */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                                    {product.tags.map((tag, index) => (
                                        <span key={index} className="bg-white/95 text-[#2D5A27] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md border border-[#2D5A27]/20">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-4">
                                {product.categoryName && (
                                    <span className="px-3 py-1 bg-[#2D5A27]/10 text-[#2D5A27] rounded-full text-xs font-bold uppercase tracking-wide">
                                        {product.categoryName}
                                    </span>
                                )}
                                {product.isAvailableForSale ? (
                                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Available
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Not Available
                                    </span>
                                )}
                            </div>

                            <div className="flex items-start justify-between gap-4 mb-4">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{product.name}</h1>
                                <ShareButton
                                    title={product.name}
                                    text={`Check out ${product.name} at Greenbird Homestead!`}
                                />
                            </div>

                            <div className="flex items-baseline mb-6">
                                <span className="text-3xl font-bold text-[#2D5A27]">Rs. {product.currentPrice}</span>
                                <span className="text-gray-500 ml-2">/ {product.unit}</span>
                            </div>

                            {/* Quantity & Add to Cart */}
                            <div className="mb-8">
                                <ProductQuantitySelector product={product} />
                            </div>

                            <div className="prose prose-green mb-8 text-gray-600">
                                <div className="text-sm leading-relaxed">
                                    {formatProductDescription(product.description || "No description available for this product.")}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                                <ShieldCheck className="h-4 w-4 mr-2 text-[#2D5A27]" />
                                <span>Secure checkout & farm-fresh guarantee</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
