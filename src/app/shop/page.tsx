import { ProductService } from "@/services/product.service";
import CategoryFilter from "@/components/shop/CategoryFilter";
import ProductList from "@/components/shop/ProductList";
import { Suspense } from "react";

export default async function ShopPage() {
    const products = await ProductService.getAllProducts();

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">

                    {/* Sidebar Filters - Responsive Component */}
                    <Suspense fallback={<div className="w-full md:w-64 bg-white rounded-2xl h-96 animate-pulse" />}>
                        <CategoryFilter />
                    </Suspense>

                    {/* Product Grid */}
                    <ProductList initialProducts={products} />

                </div>
            </div>
        </div>
    );
}
