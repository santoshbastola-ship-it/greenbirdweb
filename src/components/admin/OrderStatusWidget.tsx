import { OrderStatistics } from "@/lib/dashboard-utils";
import { ShoppingBag, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface OrderStatusWidgetProps {
    stats: OrderStatistics;
    loading?: boolean;
}

export default function OrderStatusWidget({ stats, loading = false }: OrderStatusWidgetProps) {
    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Order Overview</h3>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    const statusItems = [
        {
            label: "Open Orders",
            count: stats.open,
            icon: ShoppingBag,
            color: "bg-blue-500",
            textColor: "text-blue-700",
            bgColor: "bg-blue-50",
            href: "/admin/orders"
        },
        {
            label: "Accepted",
            count: stats.accepted,
            icon: Clock,
            color: "bg-orange-500",
            textColor: "text-orange-700",
            bgColor: "bg-orange-50",
            href: "/admin/orders"
        },
        {
            label: "Delivered",
            count: stats.delivered,
            icon: CheckCircle,
            color: "bg-green-500",
            textColor: "text-green-700",
            bgColor: "bg-green-50",
            href: "/admin/orders"
        },
        {
            label: "Cancelled",
            count: stats.cancelled,
            icon: XCircle,
            color: "bg-red-500",
            textColor: "text-red-700",
            bgColor: "bg-red-50",
            href: "/admin/orders"
        }
    ];

    const totalActive = stats.open + stats.accepted;
    const fulfillmentRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : '0';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Order Overview</h3>
                </div>
                <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All
                </Link>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Active Orders</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{totalActive}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Fulfillment</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{fulfillmentRate}%</p>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-3">
                {statusItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor} hover:shadow-sm transition-all group`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${item.color} text-white`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className={`text-sm font-medium ${item.textColor}`}>{item.label}</span>
                            </div>
                            <span className={`text-lg font-bold ${item.textColor} group-hover:scale-110 transition-transform`}>
                                {item.count}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Additional Alerts */}
            {(stats.pendingPayment > 0 || stats.dueToday > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {stats.pendingPayment > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Pending Payment</span>
                            <span className="font-bold text-orange-600">{stats.pendingPayment}</span>
                        </div>
                    )}
                    {stats.dueToday > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Due Today</span>
                            <span className="font-bold text-red-600">{stats.dueToday}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
