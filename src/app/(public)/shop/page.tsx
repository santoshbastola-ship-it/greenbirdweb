import { ProductService } from "@/services/product.service";
import CategoryFilter from "@/components/shop/CategoryFilter";
import ProductList from "@/components/shop/ProductList";
import { Suspense } from "react";
import WhatsAppOptInModal from "@/components/shop/WhatsAppOptInModal";


export const dynamic = 'force-dynamic';

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
    const { search: searchParam } = await searchParams;
    const products = await ProductService.getAllProducts();
    const searchTerm = searchParam?.toLowerCase() || "";

    const filteredProducts = searchTerm
        ? products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.categoryName?.toLowerCase().includes(searchTerm)
        )
        : products;

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">

                    {/* Top Filters - Hide if searching? Or keep? Keeping is good for clearing filters via category selection if category works that way, but for now simple keep. */}
                    {/* Actually, if searching, maybe show "Results for: ..." */}
                    {searchTerm && (
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Search Results for "{searchParam}"
                            </h2>
                            <p className="text-gray-600">
                                {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                    )}

                    <Suspense fallback={<div className="w-full bg-white rounded-xl h-20 animate-pulse" />}>
                        <CategoryFilter />
                    </Suspense>

                    {/* Product Grid */}
                    <ProductList initialProducts={filteredProducts} />

                </div>
            </div>

            <WhatsAppOptInModal />
        </div>
    );
}
