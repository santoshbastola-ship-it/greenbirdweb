import ProductForm from "@/components/admin/ProductForm";
import { ProductService } from "@/services/product.service";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";


export default async function EditProductPage({ params }: PageProps) {
    const { id } = await params;

    if (id === 'placeholder') {
        return <div className="p-20 text-center font-bold text-2xl">Loading Edit Page...</div>;
    }

    const product = await ProductService.getProductById(id);

    if (!product) {
        notFound();
    }

    return <ProductForm initialData={product} isEditMode={true} />;
}
