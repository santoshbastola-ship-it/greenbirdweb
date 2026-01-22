"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ClipboardList,
    Users,
    Activity,
    BarChart3,
    Settings,
    LogOut,
    Sprout,
    Menu,
    X,
    Zap,
    FileText,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ShoppingBag
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
        { href: "/admin/tasks", label: "Tasks", icon: ClipboardList },
        { href: "/admin/energy", label: "Energy Bills", icon: Zap },
        { href: "/admin/stock-update", label: "Stock Update", icon: Package },
        { href: "/admin/inventory", label: "Product & Price", icon: Package },
        { href: "/admin/sales", label: "Sales & Purchase", icon: ShoppingCart },
        { href: "/admin/partners", label: "Partners", icon: Users },
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
        { href: "/admin/blog", label: "Blog", icon: FileText },
        { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
        { href: "/admin/users", label: "Users", icon: Users },
    ];

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    return (
        <>
            {/* Mobile Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-700"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Sidebar Container */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 bg-green-900 text-white transform transition-all duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    isCollapsed ? "md:w-20" : "md:w-64"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between h-20 border-b border-green-800 bg-green-900 px-4">
                        {!isCollapsed && (
                            <div className="bg-white p-2 rounded-lg flex items-center justify-center flex-1 transition-all duration-300 overflow-hidden">
                                <img
                                    src="/images/logo.jpg"
                                    alt="Greenbird Logo"
                                    className="h-12 object-contain"
                                />
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="bg-white p-1 rounded-lg flex items-center justify-center w-10 h-10 transition-all duration-300">
                                <img
                                    src="/images/logo.jpg"
                                    alt="Greenbird Logo"
                                    className="h-8 object-contain"
                                />
                            </div>
                        )}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden md:flex ml-2 p-1.5 rounded-lg hover:bg-green-800 text-green-100 items-center justify-center transition-colors"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={clsx(
                                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group relative",
                                        isActive(link.href)
                                            ? "bg-green-800 text-white shadow-sm"
                                            : "text-green-100 hover:bg-green-800/50 hover:text-white"
                                    )}
                                >
                                    <Icon className={clsx("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
                                    {!isCollapsed && <span>{link.label}</span>}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-green-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                            {link.label}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="p-4 border-t border-green-800">
                        <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-green-200 hover:text-white transition-colors group relative">
                            <LogOut className={clsx("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
                            {!isCollapsed && <span>Sign Out</span>}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-green-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    Sign Out
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                />
            )}
        </>
    );
}
