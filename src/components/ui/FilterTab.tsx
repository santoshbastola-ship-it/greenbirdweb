"use client";

import React from 'react';

interface FilterTabProps {
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
}

export const FilterTab: React.FC<FilterTabProps> = ({ label, count, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full font-semibold text-xs border transition-all whitespace-nowrap ${active
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );
};
