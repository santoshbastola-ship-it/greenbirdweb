"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { BusinessType } from "@/types";

const CATEGORIES: { label: string; value: BusinessType | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Livestocks", value: "livestock" },
    { label: "Crops", value: "crop" },
    { label: "Products", value: "product" },
    { label: "Assets", value: "asset" },
];

function CategoryFilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category") || "all";

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
        <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 md:sticky md:top-24 shadow-sm md:shadow-none">
                <div className="flex items-center mb-4 md:mb-6">
                    <Filter className="h-5 w-5 mr-2 text-[#2D5A27]" />
                    <h2 className="font-extrabold text-[#5C4033] tracking-tight">Filters</h2>
                </div>

                <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 no-scrollbar">
                    <h3 className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</h3>
                    {CATEGORIES.map((cat) => {
                        const isActive = currentCategory === cat.value;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => handleCategoryClick(cat.value)}
                                className={`
                                    whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-auto md:w-full
                                    ${isActive
                                        ? "bg-[#2D5A27] text-white shadow-md"
                                        : "text-gray-600 hover:bg-[#2D5A27]/10 hover:text-[#2D5A27] bg-gray-50 md:bg-transparent"
                                    }
                                `}
                            >
                                {cat.label}
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
