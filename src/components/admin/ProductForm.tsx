"use client";

import { useState, useRef } from "react";
import { Product, BusinessType, StockUnit } from "@/types";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Link from "next/link";
import { ProductService } from "@/services/product.service";
import { Toast, ToastType } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { toNepali, formatDateTime } from "@/lib/date-helper";

interface ProductFormProps {
    initialData?: Product;
    isEditMode?: boolean;
}

export default function ProductForm({ initialData, isEditMode = false }: ProductFormProps) {
    const router = useRouter();
    const { dbUser } = useAuth();
    const changedBy = dbUser?.name || "System";
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const [formData, setFormData] = useState<Partial<Product>>(
        initialData || {
            name: "",
            businessType: "livestock",
            unit: "pcs",
            priceUnit: "pcs",
            currentPrice: 0,
            currentStock: 0,
            description: "",
            images: [],
            isAvailableForSale: true,
            isFeatured: false,
        }
    );

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode && initialData) {
                await ProductService.updateProduct(initialData.id, formData, changedBy);
                showToast("Product updated successfully");
            } else {
                await ProductService.createProduct(formData, changedBy);
                showToast("Product created successfully");
            }
            setTimeout(() => {
                router.push("/admin/inventory");
                router.refresh();
            }, 1000);
        } catch (error) {
            console.error("Error saving product:", error);
            showToast("Failed to save product", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) : value,
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const downloadURL = await ProductService.uploadProductImage(file);
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), downloadURL]
            }));
        } catch (error: any) {
            console.error("Error uploading image:", error);
            showToast(`Failed to upload image: ${error.message || 'Unknown error'}`, "error");
        } finally {
            setUploadingImage(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images?.filter((_, index) => index !== indexToRemove)
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/inventory" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? "Edit Product" : "New Product"}</h1>
                </div>
                <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                >
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? "Saving..." : "Save Product"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g., Organic Eggs"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                                <select
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="livestock">Livestock</option>
                                    <option value="crop">Crop</option>
                                    <option value="product">Product</option>
                                    <option value="asset">Asset</option>
                                </select>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Is for Sale?</label>
                                <div className="flex items-center h-[42px]">
                                    <input
                                        type="checkbox"
                                        name="isAvailableForSale"
                                        checked={formData.isAvailableForSale}
                                        onChange={handleCheckboxChange}
                                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Available on Public Store</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Product</label>
                                <div className="flex items-center h-[42px]">
                                    <input
                                        type="checkbox"
                                        name="isFeatured"
                                        checked={formData.isFeatured || false}
                                        onChange={handleCheckboxChange}
                                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Show on Home Page</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="Describe your product..."
                            />
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Pricing & Inventory</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (Rs)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs</span>
                                    <input
                                        type="number"
                                        name="currentPrice"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={formData.currentPrice}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price Unit</label>
                                <select
                                    name="priceUnit"
                                    value={formData.priceUnit}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="kg">Per Kg</option>
                                    <option value="pcs">Per Piece</option>
                                    <option value="ltr">Per Liter</option>
                                    <option value="crate">Per Crate</option>
                                    <option value="carton">Per Carton</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Unit</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="kg">Kg</option>
                                    <option value="pcs">Pieces</option>
                                    <option value="ltr">Liters</option>
                                    <option value="crate">Crates</option>
                                    <option value="carton">Cartons</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Price History */}
                    {isEditMode && formData.priceHistory && formData.priceHistory.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Price History</h2>
                            <div className="overflow-y-auto max-h-60">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">Price</th>
                                            <th className="px-4 py-2">Changed By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {formData.priceHistory.map((entry, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                                                    {formatDateTime(entry.date, "DD MMM YYYY")}
                                                </td>
                                                <td className="px-4 py-2 font-semibold text-green-700">
                                                    Rs {entry.price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 text-gray-500">
                                                    {entry.changedBy}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Media / Images */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Product Images</h2>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            {uploadingImage ? (
                                <div className="text-sm text-gray-500">Uploading...</div>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Click to upload image</p>
                                    <p className="text-xs text-gray-400 mt-1">(SVG, PNG, JPG)</p>
                                </>
                            )}
                        </div>

                        {/* Image Preview */}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {formData.images?.map((img, index) => (
                                <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={img}
                                        alt={`Product ${index + 1}`}
                                        className="object-cover w-full h-full"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center shadow-lg shadow-green-900/10 disabled:opacity-50"
                >
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? "Saving..." : "Save Product"}
                </button>
            </div>
        </form>
    );
}
