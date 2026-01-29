import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface DashboardMetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: LucideIcon;
    color: string;
    href?: string;
    loading?: boolean;
    subtitle?: string;
}

export default function DashboardMetricCard({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    color,
    href,
    loading = false,
    subtitle
}: DashboardMetricCardProps) {
    const getTrendIcon = () => {
        if (change === undefined || change === 0) return Minus;
        return change > 0 ? TrendingUp : TrendingDown;
    };

    const getTrendColor = () => {
        if (change === undefined || change === 0) return "text-gray-500";
        return change > 0 ? "text-green-600" : "text-red-600";
    };

    const TrendIcon = getTrendIcon();
    const trendColor = getTrendColor();

    const content = (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between h-full transition-all ${href ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer' : ''}`}>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {loading ? (
                    <div className="mt-2 space-y-2">
                        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                        {change !== undefined && (
                            <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                                <TrendIcon className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                    {Math.abs(change).toFixed(1)}%
                                </span>
                                {changeLabel && (
                                    <span className="text-xs text-gray-500 ml-1">{changeLabel}</span>
                                )}
                            </div>
                        )}
                        {subtitle && !change && (
                            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color} text-white flex-shrink-0`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );

    if (href && !loading) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
