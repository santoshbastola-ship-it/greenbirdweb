"use client";

import { useEffect, useState } from "react";
import { Egg, Beef, RefreshCw } from "lucide-react";

interface InventoryData {
    eggsInStock: number;
    activeBhales: number;
    lastUpdated: Date;
}

export default function LiveInventory() {
    const [inventory, setInventory] = useState<InventoryData>({
        eggsInStock: 0,
        activeBhales: 0,
        lastUpdated: new Date(),
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call to getInventory()
            // Placeholder data for now
            await new Promise(resolve => setTimeout(resolve, 500));
            setInventory({
                eggsInStock: 150,
                activeBhales: 8,
                lastUpdated: new Date(),
            });
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-12 bg-gradient-to-br from-[#FCF9F1] to-[#f5f0e4]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Live from the Farm</h2>
                        <p className="text-gray-600 mt-2">Real-time inventory updates</p>
                    </div>
                    <button
                        onClick={fetchInventory}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#1f3e1b] transition-colors disabled:opacity-50"
                        aria-label="Refresh inventory"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Eggs in Stock */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-[#2D5A27]/10 hover:border-[#2D5A27]/30 transition-all">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-[#2D5A27]/10 p-3 rounded-full">
                                        <Egg className="h-8 w-8 text-[#2D5A27]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Fresh Eggs</h3>
                                </div>
                                <div className="mb-2">
                                    <span className="text-5xl font-bold text-[#2D5A27]">
                                        {loading ? "..." : inventory.eggsInStock}
                                    </span>
                                    <span className="text-2xl text-gray-500 ml-2">pcs</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Available in stock
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${inventory.eggsInStock > 100
                                        ? 'bg-green-100 text-green-700'
                                        : inventory.eggsInStock > 50
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                    {inventory.eggsInStock > 100 ? 'In Stock' : inventory.eggsInStock > 50 ? 'Low Stock' : 'Very Low'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Active Bhales (Goats) */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-[#5C4033]/10 hover:border-[#5C4033]/30 transition-all">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-[#5C4033]/10 p-3 rounded-full">
                                        <Beef className="h-8 w-8 text-[#5C4033]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Active Bhales</h3>
                                </div>
                                <div className="mb-2">
                                    <span className="text-5xl font-bold text-[#5C4033]">
                                        {loading ? "..." : inventory.activeBhales}
                                    </span>
                                    <span className="text-2xl text-gray-500 ml-2">heads</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Ready for processing
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                    Last updated: {inventory.lastUpdated.toLocaleTimeString()}
                </div>
            </div>
        </section>
    );
}
