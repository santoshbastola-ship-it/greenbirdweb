import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import CategoryFilter from "@/components/shop/CategoryFilter";
import ProductList from "@/components/shop/ProductList";
import { Suspense } from "react";
import WhatsAppOptInModal from "@/components/shop/WhatsAppOptInModal";

// Static export compatibility
// Static export compatibility



export default async function ShopPage() {
    // Fetch all products and categories at build time/request time
    const [products, categories] = await Promise.all([
        ProductService.getAllProducts(),
        CategoryService.getActiveCategories()
    ]);

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <Suspense fallback={<div className="w-full bg-white rounded-xl h-20 animate-pulse" />}>
                        <CategoryFilter categories={categories} />
                    </Suspense>

                    {/* Product Grid - Handles filtering client-side */}
                    <ProductList initialProducts={products} categories={categories} />
                </div>
            </div>

            <WhatsAppOptInModal />
        </div>
    );
}
