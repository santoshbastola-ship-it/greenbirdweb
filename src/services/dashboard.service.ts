import { TransactionService } from "./transaction.service";
import { ProductService } from "./product.service";
import { UserService } from "./user.service";
import {
    calculateRevenueMetrics,
    getInventoryAlerts,
    getOrderStatistics,
    getTopProducts,
    getDateRange,
    getComparisonRange,
    getRevenueByBusinessType,
    DateRange,
    RevenueMetrics,
    InventoryAlert,
    OrderStatistics,
    TopProduct
} from "@/lib/dashboard-utils";
import { TransactionRecord, Product, User } from "@/types";

export interface DashboardData {
    // Revenue metrics
    todayRevenue: RevenueMetrics;
    weekRevenue: RevenueMetrics;
    monthRevenue: RevenueMetrics;

    // Order statistics
    orderStats: OrderStatistics;

    // Inventory
    inventoryAlerts: InventoryAlert[];
    totalProducts: number;
    outOfStock: number;
    lowStock: number;

    // Top performers
    topProducts: TopProduct[];

    // Revenue breakdown
    revenueByType: Record<string, number>;

    // Recent activity
    recentTransactions: TransactionRecord[];

    // Customer insights
    totalCustomers: number;
    newCustomersThisMonth: number;
}

class DashboardServiceClass {
    private cache: {
        data: DashboardData | null;
        timestamp: number;
    } = {
            data: null,
            timestamp: 0
        };

    private readonly CACHE_DURATION = 30000; // 30 seconds

    /**
     * Get all dashboard data with caching
     */
    async getDashboardData(forceRefresh: boolean = false): Promise<DashboardData> {
        const now = Date.now();

        // Return cached data if valid
        if (!forceRefresh && this.cache.data && (now - this.cache.timestamp) < this.CACHE_DURATION) {
            return this.cache.data;
        }

        // Fetch fresh data
        const data = await this.fetchDashboardData();

        // Update cache
        this.cache.data = data;
        this.cache.timestamp = now;

        return data;
    }

    /**
     * Fetch all dashboard data
     */
    private async fetchDashboardData(): Promise<DashboardData> {
        try {
            // Fetch all required data in parallel
            const [transactions, products, users] = await Promise.all([
                TransactionService.getAllTransactions(),
                ProductService.getAllProducts(),
                UserService.getAllUsers()
            ]);

            // Calculate date ranges
            const todayRange = getDateRange('today');
            const weekRange = getDateRange('week');
            const monthRange = getDateRange('month');

            const yesterdayRange = getComparisonRange(todayRange);
            const lastWeekRange = getComparisonRange(weekRange);
            const lastMonthRange = getComparisonRange(monthRange);

            // Calculate revenue metrics
            const todayRevenue = calculateRevenueMetrics(transactions, todayRange, yesterdayRange);
            const weekRevenue = calculateRevenueMetrics(transactions, weekRange, lastWeekRange);
            const monthRevenue = calculateRevenueMetrics(transactions, monthRange, lastMonthRange);

            // Get order statistics
            const orderStats = getOrderStatistics(transactions);

            // Get inventory alerts
            const inventoryAlerts = getInventoryAlerts(products);
            const outOfStock = products.filter(p => p.currentStock === 0).length;
            const lowStock = inventoryAlerts.filter(a => a.alertLevel === 'low' || a.alertLevel === 'critical').length;

            // Get top products
            const topProducts = getTopProducts(transactions, monthRange, 5);

            // Get revenue by business type
            const revenueByType = getRevenueByBusinessType(transactions, monthRange);

            // Get recent transactions (last 10)
            const recentTransactions = transactions
                .sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime())
                .slice(0, 10);

            // Customer insights
            const customers = users.filter(u => u.role === 'customer');
            const monthStart = monthRange.start;
            const newCustomersThisMonth = customers.filter(c =>
                new Date(c.createdAt) >= monthStart
            ).length;

            return {
                todayRevenue,
                weekRevenue,
                monthRevenue,
                orderStats,
                inventoryAlerts,
                totalProducts: products.length,
                outOfStock,
                lowStock,
                topProducts,
                revenueByType,
                recentTransactions,
                totalCustomers: customers.length,
                newCustomersThisMonth
            };
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            throw error;
        }
    }

    /**
     * Get revenue trend data for charts (last N days)
     */
    async getRevenueTrend(days: number = 7): Promise<{ date: string; revenue: number }[]> {
        try {
            const transactions = await TransactionService.getAllTransactions();
            const trend: { date: string; revenue: number }[] = [];

            const today = new Date();
            today.setHours(23, 59, 59, 999);

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);

                const dayRange: DateRange = { start: date, end: nextDay };
                const metrics = calculateRevenueMetrics(transactions, dayRange);

                trend.push({
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    revenue: metrics.total
                });
            }

            return trend;
        } catch (error) {
            console.error("Error fetching revenue trend:", error);
            return [];
        }
    }

    /**
     * Clear cache (useful for manual refresh)
     */
    clearCache(): void {
        this.cache.data = null;
        this.cache.timestamp = 0;
    }
}

export const DashboardService = new DashboardServiceClass();
