"use client";

import { useState, useEffect } from "react";
import { Category, BusinessType } from "@/types";
import { CategoryService } from "@/services/category.service";
import {
    Plus,
    Search,
    Trash2,
    Edit,
    X,
    Save,
    Check,
    AlertCircle,
    Bird,
    Sprout,
    Box,
    Tractor,
    Calendar,
    Filter
} from "lucide-react";
import { Toast, ToastType } from "@/components/ui/Toast";
import LogoLoader from "@/components/ui/LogoLoader";
import { formatDateTime } from "@/lib/date-helper";
import AdvancedSearch from "@/components/admin/AdvancedSearch";

type TabStatus = BusinessType | "ALL";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Filter state
    const [activeTab, setActiveTab] = useState<TabStatus>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>({
        name: "",
        description: "",
        businessType: "livestock",
        isActive: true
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await CategoryService.getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("Failed to fetch categories", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: ToastType = "success") => {
        setToast({ message, type });
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || "",
                businessType: category.businessType || "livestock",
                isActive: category.isActive
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                description: "",
                businessType: "livestock",
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            showToast("Category name is required", "error");
            return;
        }

        setActionLoading(true);
        try {
            if (editingCategory) {
                await CategoryService.updateCategory(editingCategory.id, formData);
                showToast("Category updated successfully");
            } else {
                await CategoryService.createCategory(formData);
                showToast("Category created successfully");
            }
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving category:", error);
            showToast("Failed to save category", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this category?")) return;

        setActionLoading(true);
        try {
            await CategoryService.deleteCategory(id);
            showToast("Category deleted successfully");
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
            showToast("Failed to delete category", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredCategories = categories.filter((cat) => {
        const matchesTab = activeTab === "ALL" || cat.businessType === activeTab;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            cat.name.toLowerCase().includes(query) ||
            (cat.description && cat.description.toLowerCase().includes(query)) ||
            (cat.businessType && cat.businessType.toLowerCase().includes(query));

        const catDate = cat.createdAt ? new Date(cat.createdAt) : new Date();
        const matchesStartDate = !startDate || catDate >= new Date(startDate);
        const matchesEndDate = !endDate || catDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999));

        return matchesTab && matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    const getTabCount = (tab: TabStatus) => {
        return categories.filter(cat => tab === "ALL" || cat.businessType === tab).length;
    };

    const tabs: { label: string; status: TabStatus }[] = [
        { label: "All", status: "ALL" },
        { label: "Livestock", status: "livestock" },
        { label: "Crops", status: "crop" },
        { label: "Products", status: "product" },
        { label: "Assets", status: "asset" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LogoLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-500 mt-1">Manage categories for Livestock, Crops, Products, and Assets.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium w-full sm:w-auto"
                    >
                        <Plus className="h-5 w-5" />
                        New Category
                    </button>
                </div>

                {/* Filters */}
                <AdvancedSearch
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                    endDate={endDate}
                    onEndDateChange={setEndDate}
                    placeholder="Search categories..."
                />

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.status}
                                onClick={() => setActiveTab(tab.status)}
                                className={`flex-1 min-w-[100px] sm:min-w-[120px] px-4 sm:px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.status
                                    ? "text-green-600 border-b-2 border-green-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.status
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

                {/* Categories List */}
                {filteredCategories.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <Filter className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab === "ALL" ? "" : activeTab} categories found</h3>
                        <p className="text-gray-500">Categories matching your criteria will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCategories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                onEdit={() => handleOpenModal(category)}
                                onDelete={(e) => handleDelete(e, category.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCategory ? "Edit Category" : "New Category"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g., Dairy, Vegetables, Tools"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Business Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.businessType}
                                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value as BusinessType })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="livestock">Livestock</option>
                                    <option value="crop">Crops</option>
                                    <option value="product">Products</option>
                                    <option value="asset">Assets</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="Short description..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active Category
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                                >
                                    {actionLoading ? "Saving..." : (
                                        <>
                                            <Save className="h-5 w-5 mr-2" />
                                            {editingCategory ? "Update Category" : "Save Category"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CategoryCard({
    category,
    onEdit,
    onDelete
}: {
    category: Category;
    onEdit: () => void;
    onDelete: (e: React.MouseEvent) => void;
}) {
    const styles = getBusinessTypeStyles(category.businessType || "product");

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-3 rounded-full flex-shrink-0 ${styles.bg}`}>
                        <styles.icon className={`h-6 w-6 ${styles.text}`} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{category.name}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span className={`capitalize ${styles.text} font-medium`}>{category.businessType || "Other"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {category.description && (
                <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {category.description}
                </div>
            )}

            <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${category.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                    }`}>
                    {category.isActive ? "Active" : "Inactive"}
                </span>
            </div>
        </div>
    );
}

function getBusinessTypeStyles(type: BusinessType) {
    switch (type) {
        case "livestock":
            return { icon: Bird, bg: "bg-orange-50", text: "text-orange-600" };
        case "crop":
            return { icon: Sprout, bg: "bg-green-50", text: "text-green-600" };
        case "product":
            return { icon: Box, bg: "bg-blue-50", text: "text-blue-600" };
        case "asset":
            return { icon: Tractor, bg: "bg-gray-50", text: "text-gray-600" };
        default:
            return { icon: Box, bg: "bg-gray-50", text: "text-gray-600" };
    }
}
