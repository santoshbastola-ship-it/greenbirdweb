"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { Product, BusinessType } from "@/types";
import { Package, Clock, Edit } from "lucide-react";
import StockUpdateModal from "@/components/admin/StockUpdateModal";
import StockHistoryModal from "@/components/admin/StockHistoryModal";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import { toNepali } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import LogoLoader from "@/components/ui/LogoLoader";
import { FilterTab } from "@/components/ui/FilterTab";

export default function QuickStockUpdatePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [filterType, setFilterType] = useState<BusinessType | "ALL">("ALL");
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        let result = products;

        // Filter by category
        if (filterType !== "ALL") {
            result = result.filter(p => p.businessType === filterType);
        }

        // Filter by search
        const query = searchTerm.toLowerCase();
        if (searchTerm.trim()) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.businessType.toLowerCase().includes(query)
            );
        }

        // Filter by Date (Last Updated)
        if (startDate || endDate) {
            result = result.filter(p => {
                // If no history, we can't filter by date effectively, or assume it's never updated? 
                // Let's assume if no history, it doesn't match a date filter unless we check created date (if available).
                // The current code shows 'Last: -' if no history. Let's exclude if no history when filtering by date.
                if (!p.stockHistory || p.stockHistory.length === 0) return false;

                const lastUpdate = new Date(p.stockHistory[0].date);

                const matchesStartDate = !startDate || lastUpdate >= new NepaliDate(startDate).toJsDate();
                const matchesEndDate = !endDate || lastUpdate <= new Date(new NepaliDate(endDate).toJsDate().setHours(23, 59, 59, 999));

                return matchesStartDate && matchesEndDate;
            });
        }

        setFilteredProducts(result);
    }, [searchTerm, startDate, endDate, products, filterType]);

    const loadProducts = async () => {
        setLoading(true);
        const data = await ProductService.getAllProducts();
        setProducts(data);
        setLoading(false);
    };

    const handleUpdateClick = (product: Product) => {
        setSelectedProduct(product);
        setIsUpdateModalOpen(true);
    };

    const handleHistoryClick = (product: Product) => {
        setSelectedProduct(product);
        setIsHistoryModalOpen(true);
    };

    const onProductUpdated = async () => {
        await loadProducts();
        const updated = await ProductService.getProductById(selectedProduct!.id);
        if (updated) setSelectedProduct(updated);
    };

    const getTabCount = (type: BusinessType | "ALL") => {
        if (type === "ALL") return products.length;
        return products.filter(p => p.businessType === type).length;
    };

    const tabs: { label: string; type: BusinessType | "ALL" }[] = [
        { label: "All", type: "ALL" },
        { label: "Livestock", type: "livestock" },
        { label: "Crop", type: "crop" },
        { label: "Product", type: "product" },
        { label: "Asset", type: "asset" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LogoLoader />
            </div>
        );
    }

    return (
        <div className="space-y-8 pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Stock Update</h1>
                </div>

                <AdvancedSearch
                    searchQuery={searchTerm}
                    onSearchChange={setSearchTerm}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                    endDate={endDate}
                    onEndDateChange={setEndDate}
                    placeholder="Search"
                />

                {/* Tabs */}
                <div className="mb-6 -mx-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                        {tabs.map((tab) => (
                            <FilterTab
                                key={tab.type}
                                label={tab.label}
                                count={getTabCount(tab.type)}
                                active={filterType === tab.type}
                                onClick={() => setFilterType(tab.type)}
                            />
                        ))}
                    </div>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="space-y-4">
                        {filteredProducts.map(product => {
                            const isLowStock = product.currentStock < 10;
                            const stockColorClass = isLowStock ? 'text-red-600' : 'text-green-600';
                            const bgColorClass = isLowStock ? 'bg-red-50' : 'bg-green-50';

                            return (
                                <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow gap-4 group">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="h-10 w-10 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                                            {product.images?.[0] ? (
                                                <img
                                                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                />
                                            ) : (
                                                <div className={`h-full w-full ${bgColorClass} flex items-center justify-center`}>
                                                    <Package className={`h-5 w-5 ${stockColorClass}`} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3
                                                className="font-bold text-gray-900 text-base truncate cursor-pointer hover:text-green-600 transition-colors"
                                                onClick={() => handleUpdateClick(product)}
                                            >
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                    {product.categoryName || product.businessType}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    Unit: {product.unit}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-[10px] text-gray-400">
                                                    Last: {product.stockHistory && product.stockHistory.length > 0
                                                        ? toNepali(product.stockHistory[0].date)
                                                        : "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div
                                            className="text-right cursor-pointer group"
                                            onClick={() => handleUpdateClick(product)}
                                        >
                                            <p className={`font-black text-lg ${stockColorClass}`}>
                                                {product.currentStock} <span className="text-xs font-bold uppercase">{product.unit}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleHistoryClick(product)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                            title="View History"
                                        >
                                            <Clock className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                )}

                {isUpdateModalOpen && selectedProduct && (
                    <StockUpdateModal
                        product={selectedProduct}
                        onClose={() => setIsUpdateModalOpen(false)}
                        onUpdate={onProductUpdated}
                    />
                )}

                {isHistoryModalOpen && selectedProduct && (
                    <StockHistoryModal
                        product={selectedProduct}
                        onClose={() => setIsHistoryModalOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
