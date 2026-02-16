"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Category } from "@/types";

interface CategoryFilterProps {
    categories: Category[];
}

function CategoryFilterContent({ categories }: CategoryFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { dbUser } = useAuth();
    const currentCategory = searchParams.get("category") || "all";
    const viewId = searchParams.get("view");

    if (viewId) return null;

    const isAdminOrManager = dbUser?.role === 'admin' || dbUser?.role === 'manager';

    const handleCategoryClick = (categoryValue: string) => {
        const params = new URLSearchParams(searchParams);
        if (categoryValue === "all") {
            params.delete("category");
        } else {
            params.set("category", categoryValue);
        }
        router.push(`/shop?${params.toString()}`);
    };

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
                                        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                                        ${isActive
                                            ? 'bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/30 transform scale-105'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
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

export default function CategoryFilter({ categories }: CategoryFilterProps) {
    return (
        <Suspense fallback={<div className="w-full md:w-64">Loading filters...</div>}>
            <CategoryFilterContent categories={categories} />
        </Suspense>
    );
}
