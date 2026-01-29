"use client";

import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface RevenueChartProps {
    data: { date: string; revenue: number }[];
    loading?: boolean;
}

export default function RevenueChart({ data, loading = false }: RevenueChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (loading || !mounted) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Revenue Trend</h3>
                </div>
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Revenue Trend</h3>
                </div>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No data available
                </div>
            </div>
        );
    }

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
    const minRevenue = Math.min(...data.map(d => d.revenue), 0);
    const range = maxRevenue - minRevenue || 1;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Revenue Trend (Last 7 Days)</h3>
                </div>
                <div className="text-sm text-gray-500">
                    Total: <span className="font-bold text-gray-900">Rs {data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</span>
                </div>
            </div>

            <div className="relative h-64">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500">
                    <span>Rs {Math.round(maxRevenue).toLocaleString()}</span>
                    <span>Rs {Math.round(maxRevenue * 0.75).toLocaleString()}</span>
                    <span>Rs {Math.round(maxRevenue * 0.5).toLocaleString()}</span>
                    <span>Rs {Math.round(maxRevenue * 0.25).toLocaleString()}</span>
                    <span>0</span>
                </div>

                {/* Chart area */}
                <div className="absolute left-16 right-0 top-0 bottom-8 pl-4">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="border-t border-gray-100"></div>
                        ))}
                    </div>

                    {/* Bars */}
                    <div className="relative h-full flex items-end justify-between gap-2">
                        {data.map((item, index) => {
                            const height = ((item.revenue - minRevenue) / range) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center group">
                                    {/* Tooltip */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        Rs {item.revenue.toLocaleString()}
                                    </div>
                                    {/* Bar */}
                                    <div
                                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:from-green-600 hover:to-green-500 cursor-pointer"
                                        style={{ height: `${Math.max(height, 2)}%` }}
                                    ></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* X-axis labels */}
                <div className="absolute left-16 right-0 bottom-0 h-8 pl-4">
                    <div className="h-full flex items-center justify-between gap-2">
                        {data.map((item, index) => (
                            <div key={index} className="flex-1 text-center text-xs text-gray-500">
                                {item.date}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
