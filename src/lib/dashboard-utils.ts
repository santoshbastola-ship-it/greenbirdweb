import { TransactionRecord, TransactionType, OrderStatus, PaymentStatus, Product } from "@/types";

export interface DateRange {
    start: Date;
    end: Date;
}

export interface RevenueMetrics {
    total: number;
    change: number;
    changePercent: number;
    transactionCount: number;
    averageOrderValue: number;
}

export interface InventoryAlert {
    productId: string;
    productName: string;
    currentStock: number;
    alertLevel: 'critical' | 'low' | 'warning';
    suggestedRestock: number;
}

export interface OrderStatistics {
    total: number;
    open: number;
    accepted: number;
    delivered: number;
    cancelled: number;
    pendingPayment: number;
    pendingReceivable: number;
    pendingPayable: number;
    dueToday: number;
}

export interface TopProduct {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    orderCount: number;
}

/**
 * Calculate revenue metrics for a given date range
 */
export function calculateRevenueMetrics(
    transactions: TransactionRecord[],
    dateRange: DateRange,
    comparisonRange?: DateRange
): RevenueMetrics {
    // Filter transactions in the main date range
    const rangeTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === TransactionType.Sale &&
            date >= dateRange.start &&
            date <= dateRange.end;
    });

    const total = rangeTransactions.reduce((sum, t) => {
        const itemsTotal = t.items.reduce((s, item) => s + item.totalPrice, 0);
        return sum + (itemsTotal - (t.discount || 0) + (t.deliveryFee || 0));
    }, 0);

    const transactionCount = rangeTransactions.length;
    const averageOrderValue = transactionCount > 0 ? total / transactionCount : 0;

    let change = 0;
    let changePercent = 0;

    // Calculate comparison if range provided
    if (comparisonRange) {
        const comparisonTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return t.type === TransactionType.Sale &&
                date >= comparisonRange.start &&
                date <= comparisonRange.end;
        });

        const comparisonTotal = comparisonTransactions.reduce((sum, t) => {
            const itemsTotal = t.items.reduce((s, item) => s + item.totalPrice, 0);
            return sum + (itemsTotal - (t.discount || 0) + (t.deliveryFee || 0));
        }, 0);

        change = total - comparisonTotal;
        changePercent = comparisonTotal > 0 ? (change / comparisonTotal) * 100 : 0;
    }

    return {
        total,
        change,
        changePercent,
        transactionCount,
        averageOrderValue
    };
}

/**
 * Get inventory alerts based on stock levels
 */
export function getInventoryAlerts(products: Product[]): InventoryAlert[] {
    const alerts: InventoryAlert[] = [];

    products.forEach(product => {
        // Calculate average stock from history (if available)
        const avgStock = product.stockHistory && product.stockHistory.length > 0
            ? product.stockHistory.reduce((sum, h) => sum + h.newStock, 0) / product.stockHistory.length
            : product.currentStock;

        let alertLevel: 'critical' | 'low' | 'warning' | null = null;
        let suggestedRestock = 0;

        if (product.currentStock === 0) {
            alertLevel = 'critical';
            suggestedRestock = Math.ceil(avgStock * 1.5);
        } else if (product.currentStock < avgStock * 0.1) {
            alertLevel = 'critical';
            suggestedRestock = Math.ceil(avgStock - product.currentStock);
        } else if (product.currentStock < avgStock * 0.25) {
            alertLevel = 'low';
            suggestedRestock = Math.ceil(avgStock * 0.5);
        } else if (product.currentStock < avgStock * 0.4) {
            alertLevel = 'warning';
            suggestedRestock = Math.ceil(avgStock * 0.3);
        }

        if (alertLevel) {
            alerts.push({
                productId: product.id,
                productName: product.name,
                currentStock: product.currentStock,
                alertLevel,
                suggestedRestock
            });
        }
    });

    // Sort by severity: critical > low > warning
    return alerts.sort((a, b) => {
        const severity = { critical: 3, low: 2, warning: 1 };
        return severity[b.alertLevel] - severity[a.alertLevel];
    });
}

/**
 * Calculate order statistics
 */
export function getOrderStatistics(transactions: TransactionRecord[]): OrderStatistics {
    const orders = transactions.filter(t => t.type === TransactionType.Sale);
    const purchases = transactions.filter(t => t.type === TransactionType.Purchase);

    const stats: OrderStatistics = {
        total: orders.length,
        open: 0,
        accepted: 0,
        delivered: 0,
        cancelled: 0,
        pendingPayment: 0,
        pendingReceivable: 0,
        pendingPayable: 0,
        dueToday: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate receivables from sales
    orders.forEach(order => {
        // Count by status
        switch (order.status) {
            case OrderStatus.Open:
                stats.open++;
                break;
            case OrderStatus.Accepted:
                stats.accepted++;
                break;
            case OrderStatus.Delivered:
                stats.delivered++;
                break;
            case OrderStatus.Cancelled:
                stats.cancelled++;
                break;
        }

        // Count pending payments
        if (order.paymentStatus === PaymentStatus.Pending ||
            order.paymentStatus === PaymentStatus.PartialCash ||
            order.paymentStatus === PaymentStatus.PartialOnline) {
            stats.pendingPayment++;

            // Calculate receivable amount (total - paid)
            const total = order.items.reduce((sum, item) => sum + item.totalPrice, 0) - (order.discount || 0) + (order.deliveryFee || 0);
            const remaining = total - (order.paidAmount || 0);
            stats.pendingReceivable += remaining;
        }

        // Count orders due today
        if (order.expectedDeliveryDate) {
            const deliveryDate = new Date(order.expectedDeliveryDate);
            deliveryDate.setHours(0, 0, 0, 0);
            if (deliveryDate.getTime() === today.getTime()) {
                stats.dueToday++;
            }
        }
    });

    // Calculate payables from purchases
    purchases.forEach(purchase => {
        if (purchase.paymentStatus === PaymentStatus.Pending ||
            purchase.paymentStatus === PaymentStatus.PartialCash ||
            purchase.paymentStatus === PaymentStatus.PartialOnline) {

            // Calculate payable amount (total - paid)
            const total = purchase.items.reduce((sum, item) => sum + item.totalPrice, 0) - (purchase.discount || 0) + (purchase.deliveryFee || 0);
            const remaining = total - (purchase.paidAmount || 0);
            stats.pendingPayable += remaining;
        }
    });

    return stats;
}

/**
 * Get top selling products
 */
export function getTopProducts(
    transactions: TransactionRecord[],
    dateRange: DateRange,
    limit: number = 5
): TopProduct[] {
    const productMap = new Map<string, TopProduct>();

    // Filter sales in date range
    const sales = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === TransactionType.Sale &&
            date >= dateRange.start &&
            date <= dateRange.end;
    });

    // Aggregate product data
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const existing = productMap.get(item.productId);
            if (existing) {
                existing.quantitySold += item.quantity;
                existing.revenue += item.totalPrice;
                existing.orderCount++;
            } else {
                productMap.set(item.productId, {
                    productId: item.productId,
                    productName: item.productName,
                    quantitySold: item.quantity,
                    revenue: item.totalPrice,
                    orderCount: 1
                });
            }
        });
    });

    // Convert to array and sort by revenue
    return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
}

/**
 * Format metric value with K/M suffixes
 */
export function formatMetricValue(value: number, decimals: number = 1): string {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(decimals) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(decimals) + 'K';
    }
    return value.toFixed(0);
}

/**
 * Get date range for common periods
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'custom', customStart?: Date, customEnd?: Date): DateRange {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            if (customStart && customEnd) {
                return { start: customStart, end: customEnd };
            }
            break;
    }

    return { start, end };
}

/**
 * Get comparison date range (previous period)
 */
export function getComparisonRange(dateRange: DateRange): DateRange {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const start = new Date(dateRange.start.getTime() - duration);
    const end = new Date(dateRange.end.getTime() - duration);
    return { start, end };
}

/**
 * Calculate revenue by business type
 */
export function getRevenueByBusinessType(
    transactions: TransactionRecord[],
    dateRange: DateRange
): Record<string, number> {
    const revenueByType: Record<string, number> = {
        livestock: 0,
        crop: 0,
        product: 0,
        asset: 0
    };

    const sales = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === TransactionType.Sale &&
            date >= dateRange.start &&
            date <= dateRange.end;
    });

    sales.forEach(sale => {
        sale.items.forEach(item => {
            revenueByType[item.businessType] = (revenueByType[item.businessType] || 0) + item.totalPrice;
        });
    });

    return revenueByType;
}
