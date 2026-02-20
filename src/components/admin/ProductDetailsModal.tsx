import { Product } from "@/types";
import { formatProductDescription } from "@/lib/text-helper";
import { X, Edit2, Package, Check, ShoppingCart, Home, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toNepali } from "@/lib/date-helper";
import { ProductService } from "@/services/product.service";
import UserName from "@/components/ui/UserName";
import ProductImageGallery from "@/components/shop/ProductImageGallery";


interface ProductDetailsModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailsModal({ product: initialProduct, onClose }: ProductDetailsModalProps) {
    const [product, setProduct] = useState<Product>(initialProduct);
    const [loading, setLoading] = useState(false);

    // Fetch fresh data on mount to handle state staleness if the inventory list hasn't refreshed
    useEffect(() => {
        let isMounted = true;
        const fetchFreshData = async () => {
            if (initialProduct.id) {
                setLoading(true);
                try {
                    const freshData = await ProductService.getProductById(initialProduct.id);
                    if (isMounted && freshData) {
                        console.log("[ProductDetailsModal] Fetched fresh data for modal", freshData.id);
                        setProduct(freshData);
                    }
                } catch (error) {
                    console.error("Failed to refresh product data in modal", error);
                } finally {
                    if (isMounted) setLoading(false);
                }
            }
        };
        fetchFreshData();
        return () => { isMounted = false; };
    }, [initialProduct.id]);

    // Check if description already has a "Description:" header to avoid duplication
    const hasDescriptionHeader = product.description?.toLowerCase().trim().startsWith("description:");

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full uppercase">
                                {product.businessType}
                            </span>
                            {loading && <span className="text-[10px] text-green-600 animate-pulse font-bold tracking-tighter">REFRESHING...</span>}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-gray-500">
                                Created by <UserName nameOrId={product.createdBy} className="font-medium text-gray-700" />
                            </p>
                            <p className="text-xs text-gray-500">
                                on {product.createdAt ? toNepali(product.createdAt, "DD MMM YYYY, hh:mm A") : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/inventory/edit?id=${product.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center transition-colors shadow-sm"
                        >
                            <Edit2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Edit Product</span>
                        </Link>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Images & Description */}
                        <div>
                            {/* Image Section */}
                            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mb-4 h-[400px]">
                                <ProductImageGallery
                                    images={product.images || []}
                                    productName={product.name}
                                />
                            </div>

                            {/* Description */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                {!hasDescriptionHeader && (
                                    <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
                                )}
                                <div className="text-gray-600 text-sm leading-relaxed">
                                    {formatProductDescription(product.description || "No description available.")}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Key Metrics & Status */}
                        <div className="space-y-6">
                            {/* Price & Stock Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <p className="text-xs font-semibold text-green-600 uppercase mb-1">Price</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        Rs. {product.currentPrice.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">per {product.priceUnit}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Current Stock</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {product.currentStock}
                                    </p>
                                    <p className="text-xs text-gray-500">{product.unit}</p>
                                </div>
                            </div>

                            {/* Status Toggles Display */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Visibility Status</h4>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${product.isAvailableForSale ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <ShoppingCart className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Available for Sale</p>
                                            <p className="text-xs text-gray-500">Visible to customers</p>
                                        </div>
                                    </div>
                                    {product.isAvailableForSale ? (
                                        <Check className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <X className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${product.isFeatured ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <Home className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Featured</p>
                                            <p className="text-xs text-gray-500">Shown on home page</p>
                                        </div>
                                    </div>
                                    {product.isFeatured ? (
                                        <Check className="h-5 w-5 text-blue-600" />
                                    ) : (
                                        <X className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Details</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Unit Type</span>
                                        <span className="font-medium text-gray-900 capitalize">{product.unit}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Price Per</span>
                                        <span className="font-medium text-gray-900 capitalize">{product.priceUnit}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Category</span>
                                        <span className="font-medium text-gray-900 capitalize">{product.businessType}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price History */}
                            {product.priceHistory && product.priceHistory.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <History className="h-4 w-4 text-gray-500" />
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Price History</h4>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {[...product.priceHistory].reverse().map((history, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                                                <div>
                                                    <p className="font-bold text-gray-900">Rs. {history.price.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(history.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {history.changedBy && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                                                        <UserName nameOrId={history.changedBy} />
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
