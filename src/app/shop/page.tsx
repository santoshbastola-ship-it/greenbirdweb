import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import { ProductService } from "@/services/product.service";
import OrderSuccessMessage from "@/components/ui/OrderSuccessMessage";
import { Filter } from "lucide-react";

export default async function ShopPage() {
    const products = await ProductService.getAllProducts();
    const categories = ["All", "Livestocks", "Crops", "Products", "Assets"];

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar Filters - Mobile hidden for MVP simplicity, usually toggleable */}
                    <div className="hidden md:block w-64 flex-shrink-0">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 sticky top-24">
                            <div className="flex items-center mb-6">
                                <Filter className="h-5 w-5 mr-2 text-[#2D5A27]" />
                                <h2 className="font-extrabold text-[#5C4033] tracking-tight">Filters</h2>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</h3>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-[#2D5A27]/10 hover:text-[#2D5A27] transition-all"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <OrderSuccessMessage />

                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
                            <span className="text-sm text-gray-500">{products.length} items</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-gray-500">No products found.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
