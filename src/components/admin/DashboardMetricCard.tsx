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

    const getLeftBorder = () => {
        if (color.includes("red")) return "border-l-4 border-l-red-500";
        if (color.includes("orange")) return "border-l-4 border-l-orange-500";
        if (color.includes("blue")) return "border-l-4 border-l-blue-500";
        if (color.includes("purple") || color.includes("indigo")) return "border-l-4 border-l-purple-500";
        return "border-l-4 border-l-[#2D5A27]";
    };

    const getIconColor = () => {
        if (color.includes("red")) return "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400";
        if (color.includes("orange")) return "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400";
        if (color.includes("blue")) return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400";
        if (color.includes("purple") || color.includes("indigo")) return "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400";
        return "bg-green-50 text-[#2D5A27] dark:bg-green-950/20 dark:text-green-400";
    };

    const leftBorderClass = getLeftBorder();
    const iconColorClass = getIconColor();

    const content = (
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100/50 dark:border-gray-700/50 ${leftBorderClass} flex items-start justify-between h-full transition-all ${href ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''}`}>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                {loading ? (
                    <div className="mt-2 space-y-2">
                        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
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
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
                        )}
                    </>
                )}
            </div>
            <div className={`p-3 rounded-xl ${iconColorClass} flex-shrink-0 shadow-sm`}>
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
