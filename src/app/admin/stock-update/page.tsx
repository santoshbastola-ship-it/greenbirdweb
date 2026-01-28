"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { Product, BusinessType } from "@/types";
import { Package, Clock, Edit } from "lucide-react";
import StockUpdateModal from "@/components/admin/StockUpdateModal";
import StockHistoryModal from "@/components/admin/StockHistoryModal";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import NepaliDate from "nepali-date-converter";

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
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
                    placeholder="Search product by name or type..."
                />

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.type}
                                onClick={() => setFilterType(tab.type)}
                                className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-colors relative ${filterType === tab.type
                                    ? "text-green-600 border-b-2 border-green-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${filterType === tab.type
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {getTabCount(tab.type)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="space-y-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-shadow gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src={product.images[0] || "/placeholder.png"}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{product.businessType}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end sm:space-x-8 w-full sm:w-auto">
                                    <div className="text-left sm:text-right min-w-[100px]">
                                        <p className={`font-bold text-lg ${product.currentStock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                            {product.currentStock} {product.unit}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Last: {product.stockHistory && product.stockHistory.length > 0
                                                ? new Date(product.stockHistory[0].date).toLocaleDateString()
                                                : "-"}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleHistoryClick(product)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="View History"
                                        >
                                            <Clock className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateClick(product)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                                            title="Update Stock"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
