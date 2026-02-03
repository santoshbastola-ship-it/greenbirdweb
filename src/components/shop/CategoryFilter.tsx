"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { BusinessType } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { CategoryService } from "@/services/category.service";
import { Category } from "@/types";
import { useEffect, useState } from "react";

function CategoryFilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { dbUser } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const currentCategory = searchParams.get("category") || "all";

    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await CategoryService.getActiveCategories();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryClick = (categoryValue: string) => {
        const params = new URLSearchParams(searchParams);
        if (categoryValue === "all") {
            params.delete("category");
        } else {
            params.set("category", categoryValue);
        }
        router.push(`/shop?${params.toString()}`);
    };

    if (loading) {
        return <div className="w-full md:w-64 h-96 animate-pulse bg-white rounded-2xl" />;
    }

    return (
        <div className="w-full mb-8">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center mb-4">
                    <Filter className="h-5 w-5 mr-2 text-[#2D5A27]" />
                    <h2 className="font-extrabold text-[#5C4033] tracking-tight">Categories</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleCategoryClick("all")}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-semibold transition-all
                            ${currentCategory === "all"
                                ? "bg-[#2D5A27] text-white shadow-md"
                                : "bg-gray-50 text-gray-700 hover:bg-[#2D5A27]/10 hover:text-[#2D5A27]"
                            }
                        `}
                    >
                        All
                    </button>

                    {categories
                        .filter(cat => isAdminOrManager || cat.businessType !== 'asset')
                        .map((cat) => {
                            const isActive = currentCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-semibold transition-all
                                        ${isActive
                                            ? "bg-[#2D5A27] text-white shadow-md"
                                            : "bg-gray-50 text-gray-700 hover:bg-[#2D5A27]/10 hover:text-[#2D5A27]"
                                        }
                                    `}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export default function CategoryFilter() {
    return (
        <Suspense fallback={<div className="w-full md:w-64">Loading filters...</div>}>
            <CategoryFilterContent />
        </Suspense>
    );
}
