"use client";

import {
    ArrowUp,
    ArrowDown,
    DollarSign,
    ShoppingBag,
    ClipboardList,
    Activity,
    Package,
    Users,
    TrendingUp,
    Zap
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    return (
        <div className="space-y-8 pt-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back to Greenbird Farm Manager</p>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Sales"
                    value="Rs 12,500"
                    change="+15%"
                    isPositive={true}
                    icon={TrendingUp}
                    color="bg-green-500"
                />
                <StatCard
                    title="Today's Purchase"
                    value="Rs 3,200"
                    change="-5%"
                    isPositive={true} // Less purchase is technically good? or just neutral.
                    icon={ArrowDown}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Pending Orders"
                    value="8"
                    change="Needs Action"
                    isPositive={false}
                    icon={ShoppingBag}
                    color="bg-orange-500"
                    href="/admin/orders"
                />
                <StatCard
                    title="Low Stock Items"
                    value="3"
                    change="Restock"
                    isPositive={false}
                    icon={Package}
                    color="bg-red-500"
                />
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
                </div>
            </div>

            {/* Recent Activity / Pending List Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Sales Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                        <Link href="/admin/sales" className="text-sm text-blue-600 hover:text-blue-700">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold">
                                        S
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Vegetable Box Sales</p>
                                        <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">+ Rs 450</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Tasks Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900">Pending Tasks</h3>
                        <Link href="/admin/tasks" className="text-sm text-blue-600 hover:text-blue-700">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                    <span className="text-sm text-gray-700">Feed the goats (Morning)</span>
                                </div>
                                <span className="text-xs px-2 py-1 bg-white rounded border border-gray-200 text-gray-500">Due Today</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, isPositive, icon: Icon, color, href }: any) {
    const content = (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between h-full">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                <p className={`text-xs font-medium mt-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    {change}
                </p>
            </div>
            <div className={`p-3 rounded-lg ${color} text-white`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block transition-transform hover:-translate-y-1">
                {content}
            </Link>
        );
    }

    return content;
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
