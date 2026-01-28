"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, Calendar } from "lucide-react";
import dynamic from "next/dynamic";

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";

interface AdvancedSearchProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    startDate: string;
    onStartDateChange: (date: string) => void;
    endDate: string;
    onEndDateChange: (date: string) => void;
    placeholder?: string;
}

export default function AdvancedSearch({
    searchQuery,
    onSearchChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    placeholder = "Search..."
}: AdvancedSearchProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasActiveFilters = startDate !== "" || endDate !== "";

    const clearFilters = () => {
        onSearchChange("");
        onStartDateChange("");
        onEndDateChange("");
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors mr-1"
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-1.5 rounded-lg transition-all ${isExpanded || hasActiveFilters
                                ? "bg-green-100 text-green-600"
                                : "hover:bg-gray-200 text-gray-500"
                                }`}
                            title="Advanced Filters"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {hasActiveFilters && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Clear Actions if needed */}
                {(hasActiveFilters) && (
                    <div className="flex items-center">
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors whitespace-nowrap"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Advanced Filters */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 ml-1 tracking-wider">Start Date</label>
                        <div className="nepali-datepicker-container relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                            <NepaliDatePicker
                                value={startDate}
                                onChange={(date: string) => onStartDateChange(date)}
                                options={{ calenderLocale: "en", valueLocale: "en" }}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 ml-1 tracking-wider">End Date</label>
                        <div className="nepali-datepicker-container relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                            <NepaliDatePicker
                                value={endDate}
                                onChange={(date: string) => onEndDateChange(date)}
                                options={{ calenderLocale: "en", valueLocale: "en" }}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
