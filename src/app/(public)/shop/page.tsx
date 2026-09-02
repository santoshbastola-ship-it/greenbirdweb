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
    const [allProducts, categories] = await Promise.all([
        ProductService.getAllProducts(),
        CategoryService.getActiveCategories()
    ]);

    // Filter out inactive products, assets, and products hidden from app
    const products = allProducts.filter(p => 
        p.isActive !== false && 
        (p as any).isActive !== 'false' && 
        (p as any).status !== 'inactive' && 
        p.showInApp !== false && 
        p.businessType !== 'asset'
    );

    return (
        <div className="min-h-screen bg-[#FCF9F1] dark:bg-gray-900 py-6 md:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Suspense fallback={<div className="w-full bg-white dark:bg-gray-800 rounded-2xl h-64 animate-pulse" />}>
                    {/* Product List renders Shop Hero Banner FIRST, CategoryFilter SECOND, and Product Grid THIRD */}
                    <ProductList initialProducts={products} categories={categories} />
                </Suspense>
            </div>

            <WhatsAppOptInModal />
        </div>
    );
}
