"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductService } from "@/services/product.service";
import { Product, BusinessType } from "@/types";
import {
    Plus,
    Search,
    Filter,
    Trash2,
    Edit,
    MoreHorizontal,
    Package,
    Sprout,
    Tractor,
    Bird,
    Box,
    ArrowLeft
} from "lucide-react";
import StockUpdateModal from "@/components/admin/StockUpdateModal";
import StockHistoryModal from "@/components/admin/StockHistoryModal";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import { toNepali } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import { Calendar, Clock, DollarSign, ChevronRight } from "lucide-react";

type TabStatus = BusinessType | "ALL";

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<TabStatus>("ALL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isStockUpdateModalOpen, setIsStockUpdateModalOpen] = useState(false);
    const [isStockHistoryModalOpen, setIsStockHistoryModalOpen] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        // In a real app, we might pass filters to the service. 
        // For now, we fetch all and filter client-side as the dataset is small.
        const allProducts = await ProductService.getAllProducts();
        setProducts(allProducts);
        setLoading(false);
    };

    const filteredProducts = products.filter((product) => {
        // Type Filtering
        const matchesType = filterType === "ALL" || product.businessType === filterType;

        // Search Filtering
        const query = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query)) ||
            product.businessType.toLowerCase().includes(query);

        // Date Filtering (Using createdAt or last update)
        const itemDate = product.createdAt ? new Date(product.createdAt) : new Date();
        const matchesStartDate = !startDate || itemDate >= new NepaliDate(startDate).toJsDate();
        const matchesEndDate = !endDate || itemDate <= new Date(new NepaliDate(endDate).toJsDate().setHours(23, 59, 59, 999));

        return matchesType && matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    const getTabCount = (type: TabStatus) => {
        return products.filter(p => type === "ALL" || p.businessType === type).length;
    };

    const tabs: { label: string; status: TabStatus }[] = [
        { label: "All", status: "ALL" },
        { label: "Livestock", status: "livestock" },
        { label: "Crops", status: "crop" },
        { label: "Products", status: "product" },
        { label: "Assets", status: "asset" },
    ];

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await ProductService.deleteProduct(id);
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                alert("Failed to delete product");
                console.error(error);
            }
        }
    };

    const handleStockUpdate = (product: Product) => {
        setSelectedProduct(product);
        setIsStockUpdateModalOpen(true);
    };

    const handleStockHistory = (product: Product) => {
        setSelectedProduct(product);
        setIsStockHistoryModalOpen(true);
    };

    const handleProductUpdated = () => {
        loadProducts(); // Reload to get fresh data
    };

    const getBusinessIcon = (type: BusinessType) => {
        switch (type) {
            case "livestock": return <Bird className="h-4 w-4 text-orange-500" />;
            case "crop": return <Sprout className="h-4 w-4 text-green-500" />;
            case "product": return <Box className="h-4 w-4 text-blue-500" />;
            case "asset": return <Tractor className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Product & Price</h1>
                        <p className="text-gray-500">Manage your farm products, crops, and assets</p>
                    </div>
                </div>
                <Link
                    href="/admin/inventory/add"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add Product
                </Link>
            </div>

            {/* Filters */}
            <AdvancedSearch
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                placeholder="Search by Name, Description, or Type..."
            />

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.status}
                            onClick={() => setFilterType(tab.status)}
                            className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-colors relative ${filterType === tab.status
                                ? "text-green-600 border-b-2 border-green-600"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${filterType === tab.status
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                    }`}>
                                    {getTabCount(tab.status)}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Products List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No {filterType === "ALL" ? "" : filterType} products found</h3>
                    <p className="text-gray-500">Products matching your criteria will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onStockUpdate={() => handleStockUpdate(product)}
                            onStockHistory={() => handleStockHistory(product)}
                            onDelete={() => handleDelete(product.id)}
                            icon={getBusinessIcon(product.businessType)}
                        />
                    ))}
                </div>
            )}

            {isStockUpdateModalOpen && selectedProduct && (
                <StockUpdateModal
                    product={selectedProduct!}
                    onClose={() => setIsStockUpdateModalOpen(false)}
                    onUpdate={handleProductUpdated}
                />
            )}

            {isStockHistoryModalOpen && selectedProduct && (
                <StockHistoryModal
                    product={selectedProduct!}
                    onClose={() => setIsStockHistoryModalOpen(false)}
                />
            )}
        </div>
    );
}

function ProductCard({
    product,
    onStockUpdate,
    onStockHistory,
    onDelete,
    icon
}: {
    product: Product;
    onStockUpdate: () => void;
    onStockHistory: () => void;
    onDelete: () => void;
    icon: React.ReactNode;
}) {
    // Determine stock status color
    const isLowStock = product.currentStock <= 10;
    const stockColorClass = isLowStock ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50";

    const lastUpdated = product.stockHistory && product.stockHistory.length > 0
        ? new Date(product.stockHistory[0].date)
        : (product.createdAt ? new Date(product.createdAt) : null);

    const formattedDate = lastUpdated ? toNepali(lastUpdated, "DD MMM YYYY") : "N/A";

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Image and Info */}
                <div className="min-w-0 flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-50">
                        <img
                            className="h-16 w-16 object-cover"
                            src={product.images[0] || "/placeholder.png"}
                            alt={product.name}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg block truncate">
                                {product.name}
                            </h3>
                            <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                                {icon}
                            </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {formattedDate}
                        </div>
                        {product.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-[200px]">
                                {product.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Middle: Stock (Hidden on small mobile) */}
                <div className="hidden sm:block flex-1 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                        <button
                            onClick={onStockUpdate}
                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all hover:scale-105 ${stockColorClass}`}
                        >
                            {product.currentStock} {product.unit}
                        </button>
                        <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Current Stock</span>
                    </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex items-center gap-6">
                    <div className="text-right whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600">
                            Rs. {product.currentPrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                            Per {product.unit}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onStockHistory}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Stock History"
                        >
                            <Package className="h-5 w-5" />
                        </button>
                        <Link
                            href={`/admin/inventory/edit/${product.id}`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                        >
                            <Edit className="h-5 w-5" />
                        </Link>
                        <button
                            onClick={onDelete}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Stock Info */}
            <div className="sm:hidden mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                <span className="text-gray-500">Stock:</span>
                <button
                    onClick={onStockUpdate}
                    className={`px-2 py-0.5 rounded-full font-bold ${stockColorClass}`}
                >
                    {product.currentStock} {product.unit}
                </button>
            </div>
        </div>
    );
}
