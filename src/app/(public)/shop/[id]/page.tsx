import { ProductService } from "@/services/product.service";
import { notFound } from "next/navigation";
import ProductDetailView from "@/components/shop/ProductDetailView";

interface PageProps {
    params: Promise<{ id: string }>;
}

// In development, this behaves dynamically (good for new products).
// In 'output: export', this effectively behaves as static-only (fallback not supported).

export async function generateStaticParams() {
    const products = await ProductService.getAllProducts();
    return products.map((product) => ({
        id: product.id,
    }));
}

export default async function ProductDetailsPage({ params }: PageProps) {
    const { id } = await params;

    // Handle placeholder for build time - though dynamicParams=false should might prevent this if not in params
    if (id === 'placeholder') {
        return <div className="min-h-screen bg-[#FCF9F1] py-12 flex items-center justify-center font-bold text-2xl">Loading Product Details...</div>;
    }

    const product = await ProductService.getProductById(id);

    if (!product) {
        notFound();
    }

    // Hide if not shown in app
    if (product.showInApp === false) {
        notFound();
    }

    // Use the client-side enhanced component that handles re-fetching works
    return (
        <div className="min-h-screen bg-[#FCF9F1] dark:bg-gray-900 py-12 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ProductDetailView
                    product={product}
                />
            </div>
        </div>
    );
}
