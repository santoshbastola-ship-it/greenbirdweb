"use client";

import { useEffect, useState } from "react";
import {
    DollarSign,
    ShoppingBag,
    Package,
    TrendingUp,
    Users,
    Calendar,
    RefreshCw,
    Zap,
    ClipboardList
} from "lucide-react";
import Link from "next/link";
import { DashboardService, DashboardData } from "@/services/dashboard.service";
import DashboardMetricCard from "@/components/admin/DashboardMetricCard";
import InventoryAlerts from "@/components/admin/InventoryAlerts";
import OrderStatusWidget from "@/components/admin/OrderStatusWidget";
import RevenueChart from "@/components/admin/RevenueChart";
import { formatMetricValue } from "@/lib/dashboard-utils";
import { toNepali } from "@/lib/date-helper";
import { TransactionType } from "@/types";

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [revenueTrend, setRevenueTrend] = useState<{ date: string; revenue: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        loadDashboardData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadDashboardData(true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async (isRefresh: boolean = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [data, trend] = await Promise.all([
                DashboardService.getDashboardData(isRefresh),
                DashboardService.getRevenueTrend(7)
            ]);
            setDashboardData(data);
            setRevenueTrend(trend);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        DashboardService.clearCache();
        loadDashboardData(true);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Greenbird Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardMetricCard
                    title="Today's Sales"
                    value={`Rs ${dashboardData?.todayRevenue.total.toLocaleString() || '0'}`}
                    change={dashboardData?.todayRevenue.changePercent}
                    changeLabel="vs yesterday"
                    icon={TrendingUp}
                    color="bg-green-500"
                    loading={loading}
                />
                <DashboardMetricCard
                    title="Weekly Revenue"
                    value={`Rs ${formatMetricValue(dashboardData?.weekRevenue.total || 0)}`}
                    change={dashboardData?.weekRevenue.changePercent}
                    changeLabel="vs last week"
                    icon={DollarSign}
                    color="bg-blue-500"
                    loading={loading}
                />
                <DashboardMetricCard
                    title="Monthly Revenue"
                    value={`Rs ${formatMetricValue(dashboardData?.monthRevenue.total || 0)}`}
                    change={dashboardData?.monthRevenue.changePercent}
                    changeLabel="vs last month"
                    icon={DollarSign}
                    color="bg-purple-500"
                    loading={loading}
                />
                <DashboardMetricCard
                    title="Avg Order Value"
                    value={`Rs ${Math.round(dashboardData?.monthRevenue.averageOrderValue || 0).toLocaleString()}`}
                    subtitle="This month"
                    icon={ShoppingBag}
                    color="bg-indigo-500"
                    loading={loading}
                />
            </div>

            {/* Actionable Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardMetricCard
                    title="Pending Orders"
                    value={dashboardData?.orderStats.open || 0}
                    subtitle="Needs action"
                    icon={ShoppingBag}
                    color="bg-orange-500"
                    href="/admin/orders"
                    loading={loading}
                />
                <DashboardMetricCard
                    title="Low Stock Items"
                    value={dashboardData?.lowStock || 0}
                    subtitle="Restock needed"
                    icon={Package}
                    color="bg-red-500"
                    href="/admin/inventory"
                    loading={loading}
                />
                <DashboardMetricCard
                    title="Receivable"
                    value={`Rs ${Math.round(dashboardData?.orderStats.pendingReceivable || 0).toLocaleString()}`}
                    subtitle={`${dashboardData?.orderStats.pendingPayment || 0} pending orders`}
                    icon={DollarSign}
                    color="bg-green-500"
                    href="/admin/orders"
                    loading={loading}
                />
                <DashboardMetricCard
                    title="Payable"
                    value={`Rs ${Math.round(dashboardData?.orderStats.pendingPayable || 0).toLocaleString()}`}
                    subtitle="Pending purchases"
                    icon={DollarSign}
                    color="bg-red-500"
                    href="/admin/purchases"
                    loading={loading}
                />
                <DashboardMetricCard
                    title="Due Today"
                    value={dashboardData?.orderStats.dueToday || 0}
                    subtitle="Delivery scheduled"
                    icon={Calendar}
                    color="bg-cyan-500"
                    href="/admin/orders"
                    loading={loading}
                />
            </div>

            {/* Revenue Chart */}
            <RevenueChart data={revenueTrend} loading={loading} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Status Widget */}
                <OrderStatusWidget
                    stats={dashboardData?.orderStats || {
                        total: 0,
                        open: 0,
                        accepted: 0,
                        delivered: 0,
                        cancelled: 0,
                        pendingPayment: 0,
                        pendingReceivable: 0,
                        pendingPayable: 0,
                        dueToday: 0
                    }}
                    loading={loading}
                />

                {/* Inventory Alerts */}
                <InventoryAlerts
                    alerts={dashboardData?.inventoryAlerts || []}
                    loading={loading}
                />
            </div>

            {/* Top Products & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-gray-400" />
                            <h3 className="font-bold text-gray-900">Top Products (This Month)</h3>
                        </div>
                        <Link href="/admin/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View Report
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    ) : dashboardData?.topProducts && dashboardData.topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {dashboardData.topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.productName}</p>
                                            <p className="text-xs text-gray-500">{product.quantitySold} units sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">Rs {product.revenue.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">{product.orderCount} orders</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No sales data available</p>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                            <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                        </div>
                        <Link href="/admin/sales" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View All
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    ) : dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                        <div className="space-y-4">
                            {dashboardData.recentTransactions.slice(0, 5).map((transaction) => {
                                const total = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - (transaction.discount || 0) + (transaction.deliveryFee || 0);
                                const isSale = transaction.type === TransactionType.Sale;
                                return (
                                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center space-x-3">
                                            <div className={`h-10 w-10 ${isSale ? 'bg-green-50' : 'bg-blue-50'} rounded-full flex items-center justify-center ${isSale ? 'text-green-600' : 'text-blue-600'} font-bold`}>
                                                {isSale ? 'S' : 'P'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{transaction.billNo}</p>
                                                <p className="text-xs text-gray-500">
                                                    {transaction.partyName} • {toNepali(transaction.date, "DD MMM")}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`font-bold ${isSale ? 'text-green-600' : 'text-blue-600'}`}>
                                            {isSale ? '+' : '-'} Rs {total.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No recent transactions</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Access Grid */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Access</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickLink href="/admin/orders" label="Orders" icon={ShoppingBag} color="bg-orange-100 text-orange-700" />
                    <QuickLink href="/admin/tasks" label="Tasks" icon={ClipboardList} color="bg-purple-100 text-purple-700" />
                    <QuickLink href="/admin/stock-update" label="Stock" icon={Package} color="bg-teal-100 text-teal-700" />
                    <QuickLink href="/admin/inventory" label="Products" icon={Package} color="bg-blue-100 text-blue-700" />
                    <QuickLink href="/admin/sales" label="Sales" icon={DollarSign} color="bg-green-100 text-green-700" />
                    <QuickLink href="/admin/energy" label="Energy" icon={Zap} color="bg-yellow-100 text-yellow-700" />
                    <QuickLink href="/admin/partners" label="Partners" icon={Users} color="bg-indigo-100 text-indigo-700" />
                    <QuickLink href="/admin/reports" label="Reports" icon={TrendingUp} color="bg-pink-100 text-pink-700" />
                </div>
            </div>
        </div>
    );
}

function QuickLink({ href, label, icon: Icon, color }: any) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center p-6 rounded-xl transition-transform hover:-translate-y-1 hover:shadow-md ${color.split(' ')[0]}`}
        >
            <Icon className={`h-8 w-8 mb-3 ${color.split(' ')[1]}`} />
            <span className={`font-medium ${color.split(' ')[1]}`}>{label}</span>
        </Link>
    );
}
