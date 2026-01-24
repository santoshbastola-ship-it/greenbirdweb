"use client";

import { useState, useEffect } from "react";
import { ReportType, BusinessType, PaymentStatus, Product, User } from "@/types";
import { ProductService } from "@/services/product.service";
import { Filter, Calendar, Package, DollarSign, User as UserIcon, Store } from "lucide-react";
import { toNepali } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import dynamic from 'next/dynamic';

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
});

import "nepali-datepicker-reactjs/dist/index.css";

interface ReportFiltersProps {
    onGenerate: (filters: {
        reportType: ReportType;
        startDate: Date;
        endDate: Date;
        businessType?: BusinessType;
        paymentStatus?: PaymentStatus;
        productId?: string;
        customerId?: string;
    }) => void;
    isLoading: boolean;
    customers: User[];
    vendors: User[];
}

export default function ReportFilters({ onGenerate, isLoading, customers, vendors }: ReportFiltersProps) {
    const [reportType, setReportType] = useState<ReportType>(ReportType.Sales);
    const [startDateBS, setStartDateBS] = useState<string>(toNepali(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    const [endDateBS, setEndDateBS] = useState<string>(toNepali(new Date()));
    const [businessType, setBusinessType] = useState<BusinessType | "">("");
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
    const [productId, setProductId] = useState<string>("");
    const [customerId, setCustomerId] = useState<string>("");

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (businessType) {
            setFilteredProducts(products.filter(p => p.businessType === businessType));
            setProductId(""); // Reset product selection when business type changes
        } else {
            setFilteredProducts(products);
        }
    }, [businessType, products]);

    const loadProducts = async () => {
        const allProducts = await ProductService.getAllProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
    };

    const handleGenerate = () => {
        onGenerate({
            reportType,
            startDate: new NepaliDate(startDateBS).toJsDate(),
            endDate: new NepaliDate(endDateBS).toJsDate(),
            businessType: businessType || undefined,
            paymentStatus: paymentStatus || undefined,
            productId: productId || undefined,
            customerId: customerId || undefined,
        });
    };

    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Report Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Type
                    </label>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as ReportType)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value={ReportType.Sales}>Sales Report</option>
                        <option value={ReportType.Purchases}>Purchase Report</option>
                        <option value={ReportType.Stock}>Stock Report</option>
                        <option value={ReportType.Customer}>Customer Report</option>
                        <option value={ReportType.Vendor}>Vendor Report</option>
                    </select>
                </div>

                {/* Date Range */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date Range
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 nepali-datepicker-container">
                            <NepaliDatePicker
                                value={startDateBS}
                                onChange={(date: string) => setStartDateBS(date)}
                                options={{ calenderLocale: "en", valueLocale: "en" }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <span className="self-center text-gray-500">to</span>
                        <div className="flex-1 nepali-datepicker-container">
                            <NepaliDatePicker
                                value={endDateBS}
                                onChange={(date: string) => setEndDateBS(date)}
                                options={{ calenderLocale: "en", valueLocale: "en" }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Type Filter (Not for Customer/Vendor reports) */}
                {reportType !== ReportType.Customer && reportType !== ReportType.Vendor && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Business Type
                        </label>
                        <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value as BusinessType | "")}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            <option value="livestock">Livestock</option>
                            <option value="crop">Crop</option>
                            <option value="product">Product</option>
                            <option value="asset">Asset</option>
                        </select>
                    </div>
                )}

                {/* Product Filter (Not for Customer/Vendor reports) */}
                {reportType !== ReportType.Customer && reportType !== ReportType.Vendor && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Product
                        </label>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">All Products</option>
                            {filteredProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Payment Status Filter (Only for Sales/Purchases) */}
                {(reportType === ReportType.Sales || reportType === ReportType.Purchases) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Payment Status
                        </label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | "")}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            <option value={PaymentStatus.Pending}>Pending</option>
                            <option value={PaymentStatus.PaidCash}>Paid Cash</option>
                            <option value={PaymentStatus.PaidOnline}>Paid Online</option>
                            <option value={PaymentStatus.PartialCash}>Partial Cash</option>
                            <option value={PaymentStatus.PartialOnline}>Partial Online</option>
                        </select>
                    </div>
                )}

                {/* Customer Filter */}
                {reportType === ReportType.Customer && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Select Customer
                        </label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">All Customers</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Vendor Filter */}
                {reportType === ReportType.Vendor && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            Select Vendor
                        </label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">All Vendors</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Generate Button */}
            <div className="mt-6">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <Filter className="h-5 w-5" />
                            Generate Report
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
