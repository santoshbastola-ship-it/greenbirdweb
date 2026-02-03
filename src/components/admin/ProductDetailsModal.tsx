import { Product } from "@/types";
import { X, Edit2, Package, Check, ShoppingCart, Home, History } from "lucide-react";
import Link from "next/link";
import { toNepali } from "@/lib/date-helper";

interface ProductDetailsModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
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
                        </div>
                        <p className="text-xs text-gray-500">
                            Created on {new Date(product.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/inventory/edit/${product.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
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
                            {/* Main Image */}
                            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 aspect-square flex items-center justify-center mb-4">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-24 w-24 text-gray-300" />
                                )}
                            </div>

                            {/* Additional Images (if any) */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {product.images.slice(1).map((img, idx) => (
                                        <div key={idx} className="h-16 w-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                            <img src={img} alt={`${product.name} ${idx + 2}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {product.description || "No description available."}
                                </p>
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
                                                        {history.changedBy === 'admin' ? 'Admin' : history.changedBy}
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
