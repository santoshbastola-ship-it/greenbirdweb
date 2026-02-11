"use client";

import ProductForm from "@/components/admin/ProductForm";
import { ProductService } from "@/services/product.service";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Product } from "@/types";

export default function EditProductPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            ProductService.getProductById(id).then((data) => {
                setProduct(data);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return <div className="p-20 text-center font-bold text-2xl">Loading Product...</div>;
    }

    if (!product) {
        return <div className="p-20 text-center font-bold text-red-500">Product not found</div>;
    }

    return <ProductForm initialData={product} isEditMode={true} />;
}
