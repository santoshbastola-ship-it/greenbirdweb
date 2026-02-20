"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, ShoppingCart, User, X, Sprout, Bell, Truck, Package, Store, LogOut, LayoutDashboard, Home, BookOpen, FileText, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import CartBadge from "./CartBadge";
import { NotificationService } from "@/services/notification.service";
import SearchInput from "@/components/common/SearchInput";
import { useCartStore } from "@/store/useCartStore";

import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/transaction.service";
import { TransactionType, OrderStatus } from "@/types";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { user, dbUser, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeOrderCount, setActiveOrderCount] = useState(0);
    const cartItems = useCartStore((state) => state.items);

    const isProfileIncomplete = user && dbUser && (!dbUser.phoneNumber || !dbUser.address);
    const hasCartItems = cartItems.length > 0;
    const hasIndicator = unreadCount > 0 || hasCartItems || isProfileIncomplete;

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/shop", label: "Shop", icon: Store },
        { href: "/about", label: "Our Story", icon: BookOpen },
        { href: "/blog", label: "Blog", icon: FileText },
        { href: "/contact", label: "Contact Us", icon: Phone },
    ];

    const isActive = (path: string) => pathname === path;

    useEffect(() => {
        setIsSearchOpen(false);
        setIsOpen(false);
    }, [pathname]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (isOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                // Check if the click was on the hamburger button itself to avoid toggle conflict
                const target = event.target as HTMLElement;
                if (!target.closest('button[aria-label="Toggle Menu"]')) {
                    setIsOpen(false);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        let unsubscribe: (() => void) | undefined;
        if (user) {
            const unsubUnread = NotificationService.subscribeToUnreadCount(user.uid, (count) => {
                setUnreadCount(count);
            });

            const unsubOrders = TransactionService.subscribeToActiveOrderCount(user.uid, (count) => {
                setActiveOrderCount(count);
            });

            unsubscribe = () => {
                unsubUnread();
                unsubOrders();
            };
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            if (unsubscribe) unsubscribe();
        };
    }, [user, isOpen]);

    return (
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center relative">
                    {/* Logo */}
                    <Link href="/" className={clsx("flex items-center shrink-0", isSearchOpen && "hidden md:flex")}>
                        <img
                            src="/images/logo.png"
                            alt="Greenbird Homestead"
                            className="h-8 sm:h-12 md:h-16 w-auto object-contain"
                        />
                    </Link>

                    {/* Search Field - Visible on all screens */}
                    <div className={clsx(
                        "flex-1 mx-1 sm:mx-2 md:mx-4 transition-all duration-300 min-w-0",
                        isSearchOpen
                            ? "absolute inset-0 z-50 bg-white dark:bg-gray-900 px-4 flex items-center justify-center md:relative md:bg-transparent md:inset-auto md:max-w-xl md:justify-start"
                            : "max-w-xl"
                    )}>
                        <SearchInput
                            onFocus={() => setIsSearchOpen(true)}
                            className={clsx(isSearchOpen && "!max-w-none flex-1")}
                        />
                        {isSearchOpen && (
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="ml-2 p-2 text-gray-500 hover:text-gray-700 md:hidden"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        )}
                    </div>

                    {/* Desktop Links - Hidden on small screens, shown on large */}
                    <div className="hidden lg:flex items-center justify-center space-x-8 mx-6">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={clsx(
                                    "text-sm font-semibold transition-all duration-200 whitespace-nowrap py-2 border-b-2",
                                    isActive(link.href)
                                        ? "text-[#2D5A27] dark:text-green-400 border-[#2D5A27] dark:border-green-400"
                                        : "text-gray-600 dark:text-gray-400 border-transparent hover:text-[#2D5A27] dark:hover:text-green-400 hover:border-[#2D5A27]/30 dark:hover:border-green-400/30"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Icons */}
                    <div className={clsx("flex items-center gap-2", isSearchOpen && "hidden md:flex")}>
                        {/* Unified Menu Toggle */}
                        <div className="flex items-center">
                            {user ? (
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="flex items-center p-1 sm:p-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all shrink-0"
                                    aria-label="Toggle Menu"
                                >
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-[#2D5A27]/10 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-bold">
                                                    {(user.displayName || "U").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {(unreadCount > 0 || activeOrderCount > 0) && (
                                                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1.5">
                                            <span className="font-semibold text-sm truncate max-w-[100px]">
                                                Hi, {user.displayName?.split(" ")[0] || "User"}
                                            </span>
                                            <Menu className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="sm:hidden -ml-0.5">
                                            <Menu className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href={pathname === "/login" ? "/login" : `/login?redirect=${pathname}`} className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-full text-xs sm:text-sm font-bold hover:bg-green-700 transition-colors shrink-0 shadow-sm">
                                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span>Login</span>
                                    </Link>
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm transition-all relative"
                                        aria-label="Toggle Menu"
                                    >
                                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                        {!isOpen && hasIndicator && (
                                            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Dropdown/Mobile Menu */}
                        {isOpen && (
                            <div
                                ref={mobileMenuRef}
                                className="absolute top-full right-0 w-screen sm:w-80 mt-1 lg:mt-2 bg-white dark:bg-gray-900 lg:rounded-2xl shadow-xl lg:shadow-2xl border-t lg:border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300 z-50 overflow-hidden"
                            >
                                <div className="p-2 space-y-1">
                                    {/* Unified list for both Mobile and Desktop Dropdown */}
                                    <div className="flex flex-col">
                                        {/* Horizontal Icon Grid (Always Visible in Menu) */}
                                        <div className="grid grid-cols-5 gap-2 p-3 border-b border-gray-100 dark:border-gray-800">
                                            <Link
                                                href="/shop"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                            >
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors">
                                                    <Store className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Shop</span>
                                            </Link>
                                            <Link
                                                href="/cart"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                            >
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors relative">
                                                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                                                    <CartBadge className="-top-1 -right-1" />
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Cart</span>
                                            </Link>
                                            <Link
                                                href="/orders"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                            >
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors relative">
                                                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                                                    {activeOrderCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#2D5A27] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                                                            {activeOrderCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Orders</span>
                                            </Link>
                                            <Link
                                                href="/notifications"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                            >
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors relative">
                                                    <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                                                    {unreadCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                                                            {unreadCount > 9 ? '9+' : unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Alerts</span>
                                            </Link>
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                            >
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors overflow-hidden">
                                                    {user?.photoURL ? (
                                                        <img src={user.photoURL} alt="Profile" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />
                                                    ) : (
                                                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">Profile</span>
                                            </Link>
                                        </div>

                                        {/* Theme Toggle */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                                            <ThemeToggle />
                                        </div>

                                        {/* Vertical Nav Links */}
                                        <div className="py-2 px-2 space-y-1">
                                            {links.map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={clsx(
                                                        "flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                                                        isActive(link.href)
                                                            ? "bg-[#2D5A27]/10 text-[#2D5A27] font-semibold dark:bg-green-900/20 dark:text-green-400"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    )}
                                                >
                                                    <link.icon className={clsx("h-6 w-6", isActive(link.href) ? "text-[#2D5A27] dark:text-green-400" : "text-gray-400")} />
                                                    {link.label}
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Admin Dashboard */}
                                        {user && (dbUser?.role === 'admin' || dbUser?.role === 'manager') && (
                                            <div className="px-2 pt-2 pb-1">
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold bg-[#2D5A27] text-white hover:bg-[#20411b] transition-all shadow-md group"
                                                >
                                                    <LayoutDashboard className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                                                    Admin Dashboard
                                                </Link>
                                            </div>
                                        )}

                                        {/* Logout Section */}
                                        {user && (
                                            <div className="px-2 pb-2">
                                                <button
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        logout();
                                                    }}
                                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left group"
                                                >
                                                    <LogOut className="h-6 w-6 text-red-500 group-hover:scale-110 transition-transform" />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
