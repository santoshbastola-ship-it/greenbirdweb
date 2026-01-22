"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { Product, BusinessType } from "@/types";
import { Search, Package, ArrowLeft, History, Edit, Clock, Pen, Plus } from "lucide-react";
import Link from "next/link";
import StockUpdateModal from "@/components/admin/StockUpdateModal";
import StockHistoryModal from "@/components/admin/StockHistoryModal";

export default function QuickStockUpdatePage() {
    const [searchTerm, setSearchTerm] = useState("");
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
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerTerm) ||
                p.businessType.toLowerCase().includes(lowerTerm)
            );
        }

        setFilteredProducts(result);
    }, [searchTerm, products, filterType]);

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
        // Update selected product ref if needed, or rely on reload
        const updated = await ProductService.getProductById(selectedProduct!.id);
        if (updated) setSelectedProduct(updated);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Stock Update</h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search product by name or type..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {(["ALL", "livestock", "crop", "product", "asset"] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${filterType === type
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                            }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading products...</div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={product.images[0] || "/placeholder.png"}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end sm:space-x-4 w-full sm:w-auto">
                                <div className="text-left sm:text-right">
                                    <p className={`font-bold ${product.currentStock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                        {product.currentStock} {product.unit}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        Last: {product.stockHistory && product.stockHistory.length > 0
                                            ? new Date(product.stockHistory[0].date).toLocaleDateString()
                                            : "-"}
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleHistoryClick(product)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="View History"
                                    >
                                        <Clock className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleUpdateClick(product)}
                                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Update Stock"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No products found matching "{searchTerm}"</p>
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
    );
}
