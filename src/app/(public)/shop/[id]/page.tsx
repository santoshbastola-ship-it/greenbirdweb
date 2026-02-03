import { ProductService } from "@/services/product.service";
import { ArrowLeft, Minus, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/ui/AddToCartButton";
import ShareButton from "@/components/ui/ShareButton";

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

    const imageSrc = product.images.length > 0 ? product.images[0] : "/placeholder.png";
    const hasStock = product.currentStock > 0;

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/shop" className="inline-flex items-center text-gray-500 hover:text-[#2D5A27] mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shop
                </Link>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2">

                        {/* Image Section */}
                        <div className="bg-gray-100 relative aspect-square md:aspect-auto">
                            {/* Next/Image optimize later */}
                            <img
                                src={imageSrc}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info Section */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="px-3 py-1 bg-[#2D5A27]/10 text-[#2D5A27] rounded-full text-xs font-bold uppercase tracking-wide">
                                    {product.businessType}
                                </span>
                                {hasStock ? (
                                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                        In Stock
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Out of Stock
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

                            <div className="prose prose-green mb-8 text-gray-600">
                                <p>{product.description || "No description available for this product."}</p>
                            </div>

                            {/* Quantity & Add to Cart */}
                            <div className="border-t border-gray-100 pt-8 mt-auto">
                                <div className="flex items-center space-x-6 mb-8">
                                    <div className="flex items-center border border-gray-200 rounded-lg">
                                        <button className="p-3 hover:bg-gray-50 text-gray-500"><Minus className="h-4 w-4" /></button>
                                        <span className="w-12 text-center font-medium">1</span>
                                        <button className="p-3 hover:bg-gray-50 text-gray-500"><Plus className="h-4 w-4" /></button>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {product.currentStock} {product.unit} available
                                    </div>
                                </div>

                                <AddToCartButton
                                    product={product}
                                    fullWidth={true}
                                    className="w-full bg-[#5C4033] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2D5A27] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                />

                                <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                                    <ShieldCheck className="h-4 w-4 mr-2 text-[#2D5A27]" />
                                    <span>Secure checkout & farm-fresh guarantee</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
