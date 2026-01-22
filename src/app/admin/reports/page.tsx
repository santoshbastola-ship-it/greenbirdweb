"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Download, BarChart3 } from "lucide-react";
import Link from "next/link";
import { ReportType, TransactionRecord, TransactionType, StockHistoryEntry, User, BusinessType } from "@/types";
import { TransactionService } from "@/services/transaction.service";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import ReportFilters from "@/components/admin/reports/ReportFilters";
import ReportDisplay from "@/components/admin/reports/ReportDisplay";

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<any>(null);

    // Report Data
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [stockEntries, setStockEntries] = useState<StockHistoryEntry[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalValue, setTotalValue] = useState<number | undefined>(undefined);
    const [totalLabel, setTotalLabel] = useState<string | undefined>(undefined);
    const [stockSoldQty, setStockSoldQty] = useState<number | undefined>(undefined);

    // Filter Data
    const [customers, setCustomers] = useState<User[]>([]);
    const [vendors, setVendors] = useState<User[]>([]);

    useEffect(() => {
        loadFilterData();
    }, []);

    const loadFilterData = async () => {
        try {
            const allUsers = await UserService.getAllUsers();
            setCustomers(allUsers.filter(u => u.partnerType === "customer"));
            setVendors(allUsers.filter(u => u.partnerType === "vendor"));
        } catch (error) {
            console.error("Error loading filter data:", error);
        }
    };

    const handleGenerateReport = async (filters: any) => {
        setIsLoading(true);
        setCurrentFilters(filters);

        try {
            if (filters.reportType === ReportType.Sales || filters.reportType === ReportType.Purchases) {
                await generateTransactionReport(filters);
            } else if (filters.reportType === ReportType.Stock) {
                await generateStockReport(filters);
            } else if (filters.reportType === ReportType.Customer || filters.reportType === ReportType.Vendor) {
                await generatePartnerReport(filters);
            }
            setReportGenerated(true);
        } catch (error) {
            console.error("Error generating report:", error);
            alert("Failed to generate report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const generateTransactionReport = async (filters: any) => {
        const allTransactions = await TransactionService.getAllTransactions();
        const type = filters.reportType === ReportType.Sales ? TransactionType.Sale : TransactionType.Purchase;

        // Apply filters
        const filtered = allTransactions.filter((t) => {
            if (t.type !== type) return false;

            // Date filter
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);

            if (t.date < start || t.date > end) return false;

            // Business type filter
            if (filters.businessType && !t.items.some(i => i.businessType === filters.businessType)) {
                return false;
            }

            // Payment status filter
            if (filters.paymentStatus && t.paymentStatus !== filters.paymentStatus) {
                return false;
            }

            // Product filter
            if (filters.productId) {
                if (!t.items.some(i => i.productId === filters.productId)) {
                    return false;
                }
            }

            return true;
        });

        const total = filtered.reduce((sum, t) => {
            const itemsTotal = t.items.reduce((s, item) => s + item.totalPrice, 0);
            return sum + (itemsTotal - t.discount);
        }, 0);

        const label = type === TransactionType.Sale ? 'Total Revenue' : 'Total Expenses';

        setTransactions(filtered);
        setStockEntries([]);
        setTotalCount(filtered.length);
        setTotalValue(total);
        setTotalLabel(label);
        setStockSoldQty(undefined);
    };

    const generateStockReport = async (filters: any) => {
        const allProducts = await ProductService.getAllProducts();
        const allTransactions = await TransactionService.getAllTransactions();

        // Collect all stock history entries from products
        const allEntries: StockHistoryEntry[] = [];
        allProducts.forEach(product => {
            if (product.stockHistory) {
                product.stockHistory.forEach(entry => {
                    allEntries.push(entry);
                });
            }
        });

        // Apply filters
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = allEntries.filter((e) => {
            const entryDate = new Date(e.date);
            if (entryDate < start || entryDate > end) return false;

            // Product filter
            if (filters.productId && e.productId !== filters.productId) {
                return false;
            }

            return true;
        });

        // Calculate total sold quantity from sales transactions
        let soldQty = 0;
        allTransactions.forEach(t => {
            if (t.type !== TransactionType.Sale) return;
            const tDate = new Date(t.date);
            if (tDate < start || tDate > end) return;

            t.items.forEach(item => {
                if (filters.businessType && item.businessType !== filters.businessType) return;
                if (filters.productId && item.productId !== filters.productId) return;
                soldQty += item.quantity;
            });
        });

        setStockEntries(filtered);
        setTransactions([]);
        setTotalCount(filtered.length);
        setStockSoldQty(soldQty);
        setTotalValue(undefined);
        setTotalLabel(undefined);
    };

    const generatePartnerReport = async (filters: any) => {
        const allTransactions = await TransactionService.getAllTransactions();
        const isCustomer = filters.reportType === ReportType.Customer;
        const type = isCustomer ? TransactionType.Sale : TransactionType.Purchase;

        // Apply filters
        const filtered = allTransactions.filter((t) => {
            if (t.type !== type) return false;

            // Date filter
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);

            if (t.date < start || t.date > end) return false;

            // Customer/Vendor filter
            if (filters.customerId && t.customerId !== filters.customerId) {
                return false;
            }

            return true;
        });

        const total = filtered.reduce((sum, t) => {
            const itemsTotal = t.items.reduce((s, item) => s + item.totalPrice, 0);
            return sum + (itemsTotal - t.discount);
        }, 0);

        const label = isCustomer ? 'Total Received' : 'Total Paid';

        setTransactions(filtered);
        setStockEntries([]);
        setTotalCount(filtered.length);
        setTotalValue(total);
        setTotalLabel(label);
        setStockSoldQty(undefined);
    };

    const handleExportCSV = () => {
        if (!reportGenerated || !currentFilters) {
            alert("Please generate a report first");
            return;
        }

        try {
            let csvContent = "";
            let filename = `${currentFilters.reportType}_Report_${Date.now()}.csv`;

            if (currentFilters.reportType === ReportType.Stock) {
                // Stock Report CSV
                csvContent = "Date,Product,Action Type,Change,New Stock,Note\n";
                stockEntries.forEach(entry => {
                    const date = new Date(entry.date).toLocaleDateString();
                    csvContent += `${date},${entry.productId},${entry.actionType},${entry.changeAmount},${entry.newStock},"${entry.note || ""}"\n`;
                });
            } else {
                // Transaction Report CSV
                csvContent = "Date,Bill No,Party,Items,Amount,Status\n";
                transactions.forEach(t => {
                    const date = new Date(t.date).toLocaleDateString();
                    const items = t.items.map(i => i.productName).join("; ");
                    const total = t.items.reduce((s, i) => s + i.totalPrice, 0) - t.discount;
                    csvContent += `${date},${t.billNo},${t.partyName},"${items}",${total},${t.paymentStatus}\n`;
                });
            }

            // Create and download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("Failed to export CSV. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-green-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                            </div>
                        </div>

                        {reportGenerated && (
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ReportFilters
                    onGenerate={handleGenerateReport}
                    isLoading={isLoading}
                    customers={customers}
                    vendors={vendors}
                />

                {reportGenerated && !isLoading && currentFilters && (
                    <ReportDisplay
                        reportType={currentFilters.reportType}
                        transactions={transactions}
                        stockEntries={stockEntries}
                        totalCount={totalCount}
                        totalValue={totalValue}
                        totalLabel={totalLabel}
                        stockSoldQty={stockSoldQty}
                    />
                )}

                {!reportGenerated && !isLoading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Select filters and click "Generate Report" to view data</p>
                    </div>
                )}
            </div>
        </div>
    );
}
