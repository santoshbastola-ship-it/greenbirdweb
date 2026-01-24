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

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<BusinessType | "ALL">("ALL");

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
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "ALL" || product.businessType === filterType;
        return matchesSearch && matchesType;
    });

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Product & Price</h1>
                        <p className="text-gray-500">Manage your farm products, crops, and assets</p>
                    </div>
                </div>
                <Link
                    href="/admin/inventory/add"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Product
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {(["ALL", "livestock", "crop", "product", "asset"] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterType === type
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Table */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading inventory...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                                    {/* Placeholder image logic */}
                                                    <img
                                                        className="h-10 w-10 object-cover"
                                                        src={product.images[0] || "/placeholder.png"}
                                                        alt={product.name}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{product.description || "No description"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {getBusinessIcon(product.businessType)}
                                                <span className="text-sm text-gray-700 capitalize">{product.businessType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-start cursor-pointer group" onClick={() => handleStockUpdate(product)}>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 ${product.currentStock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.currentStock} {product.unit}
                                                </span>
                                                <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Adjust</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.stockHistory && product.stockHistory.length > 0
                                                ? new Date(product.stockHistory[0].date).toLocaleDateString()
                                                : (product.createdAt ? new Date(product.createdAt).toLocaleDateString() : <span className="text-gray-400">-</span>)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Rs {product.currentPrice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleStockHistory(product)}
                                                    className="text-gray-600 hover:text-gray-900 bg-gray-50 p-2 rounded-lg"
                                                    title="View History"
                                                >
                                                    <Package className="h-4 w-4" />
                                                </button>
                                                <Link href={`/admin/inventory/edit/${product.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg">
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
