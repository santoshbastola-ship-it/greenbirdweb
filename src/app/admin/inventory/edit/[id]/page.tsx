import ProductForm from "@/components/admin/ProductForm";
import { ProductService } from "@/services/product.service";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
    const { id } = await params;
    const product = await ProductService.getProductById(id);

    if (!product) {
        notFound();
    }

    return <ProductForm initialData={product} isEditMode={true} />;
}
