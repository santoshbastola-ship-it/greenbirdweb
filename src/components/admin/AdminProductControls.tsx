"use client";

import { useAuth } from "@/context/AuthContext";
import { Edit } from "lucide-react";
import Link from "next/link";

interface AdminProductControlsProps {
    productId: string;
}

export default function AdminProductControls({ productId }: AdminProductControlsProps) {
    const { dbUser } = useAuth();
    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';

    if (!isAdminOrManager) {
        return null;
    }

    return (
        <Link
            href={`/admin/inventory/edit?id=${productId}`}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors ml-4"
        >
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
        </Link>
    );
}
