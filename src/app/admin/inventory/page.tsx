"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
    Home,
    ShoppingCart
} from "lucide-react";
import StockUpdateModal from "@/components/admin/StockUpdateModal";
import StockHistoryModal from "@/components/admin/StockHistoryModal";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import { toNepali } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import { Calendar, Clock, DollarSign, ChevronRight } from "lucide-react";
import LogoLoader from "@/components/ui/LogoLoader";
import ProductDetailsModal from "@/components/admin/ProductDetailsModal";
import { FilterTab } from "@/components/ui/FilterTab";

type TabStatus = BusinessType | "ALL";

import { useAuth } from "@/context/AuthContext";

export default function InventoryPage() {
    const { dbUser } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<TabStatus>("ALL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isStockUpdateModalOpen, setIsStockUpdateModalOpen] = useState(false);
    const [isStockHistoryModalOpen, setIsStockHistoryModalOpen] = useState(false);
    const [isProductViewModalOpen, setIsProductViewModalOpen] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Sync product view modal with URL 'id' parameter
    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            const product = products.find(p => p.id === id);
            if (product) {
                setSelectedProduct(product);
                setIsProductViewModalOpen(true);
            }
        } else {
            setIsProductViewModalOpen(false);
        }
    }, [searchParams, products]);

    useEffect(() => {
        if (dbUser?.role === "manager") {
            router.push("/admin");
            return;
        }
        loadProducts();
    }, [dbUser, router]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const allProducts = await ProductService.getAllProducts();
            setProducts(allProducts);
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
        }
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
                await ProductService.deleteProduct(id, dbUser?.name || "admin");
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

    const handleProductView = (product: Product) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("id", product.id);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleCloseProductView = () => {
        if (searchParams.get("id")) {
            router.back();
        } else {
            setIsProductViewModalOpen(false);
        }
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
        <div className="space-y-8 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Product & Price</h1>
                </div>
                <Link
                    href="/admin/inventory/add"
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#2D5A27] text-white rounded-xl hover:bg-[#1f3e1b] transition-all shadow-md font-bold whitespace-nowrap active:scale-95 hover:-translate-y-0.5"
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
                placeholder="Search"
            />

            {/* Tabs */}
            <div className="mb-6 -mx-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => (
                        <FilterTab
                            key={tab.status}
                            label={tab.label}
                            count={getTabCount(tab.status)}
                            active={filterType === tab.status}
                            onClick={() => setFilterType(tab.status)}
                        />
                    ))}
                </div>
            </div>

            {/* Products List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <LogoLoader />
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
                            onView={() => handleProductView(product)}
                            onStockUpdate={() => handleStockUpdate(product)}
                            onStockHistory={() => handleStockHistory(product)}
                            onDelete={dbUser?.role === "admin" ? () => handleDelete(product.id) : undefined}
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

            {isProductViewModalOpen && selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={handleCloseProductView}
                />
            )}
        </div>
    );
}

function ProductCard({
    product,
    onView,
    onStockUpdate,
    onStockHistory,
    onDelete,
    icon
}: {
    product: Product;
    onView: () => void;
    onStockUpdate: () => void;
    onStockHistory: () => void;
    onDelete?: () => void;
    icon: React.ReactNode;
}) {
    // Determine stock status color
    const isLowStock = product.currentStock <= 10;
    const stockColorClass = isLowStock
        ? "text-red-700 bg-red-50 border border-red-200"
        : "text-green-700 bg-green-50 border border-green-200";

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3">
                {/* Left Section: Image & Basic Info */}
                <button
                    onClick={onView}
                    className="flex items-center gap-3 w-full sm:flex-1 min-w-0 group text-left"
                >
                    <div className="h-10 w-10 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                        {product.images?.[0] ? (
                            <img
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                src={product.images[0]}
                                alt={product.name}
                            />
                        ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                                {product.name}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                {product.categoryName || product.businessType}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px] text-gray-500 font-medium">
                                Unit: {product.unit}
                            </span>
                        </div>
                    </div>
                </button>

                {/* Right Section: Price & Stock */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-[52px] sm:pl-0">
                    {/* Price */}
                    <div className="text-left sm:text-right">
                        <div className="text-sm font-bold text-gray-900">
                            Rs. {product.currentPrice.toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ {product.priceUnit}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Icons */}
                        <div className="flex items-center gap-1">
                            <div title={product.isAvailableForSale ? "Available for Sale" : "Not for Sale"}>
                                <ShoppingCart className={`h-4 w-4 ${product.isAvailableForSale ? "text-green-600" : "text-gray-300"}`} />
                            </div>
                            <div title={product.isFeatured ? "Featured on Home" : "Not Featured"}>
                                <Home className={`h-4 w-4 ${product.isFeatured ? "text-blue-600" : "text-gray-300"}`} />
                            </div>
                        </div>

                        {/* Delete Button */}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Product"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}

                        {/* Stock Pill */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onStockUpdate();
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-transform active:scale-95 ${stockColorClass}`}
                        >
                            {product.currentStock} {product.unit}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
