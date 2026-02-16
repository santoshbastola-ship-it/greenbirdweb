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
                    <div className={clsx("flex items-center space-x-2 sm:space-x-3", isSearchOpen && "hidden md:flex")}>
                        <div className="hidden md:block">
                            <ThemeToggle />
                        </div>
                        {user && (
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                {activeOrderCount > 0 && (
                                    <Link href="/orders" className="relative p-2 text-[#2D5A27] bg-[#2D5A27]/10 hover:bg-[#2D5A27]/20 rounded-full transition-all duration-200" title="View Order Progress">
                                        <Truck className="h-5 w-5 animate-pulse" />
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#2D5A27] text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                            {activeOrderCount}
                                        </span>
                                    </Link>
                                )}
                                <Link href="/notifications" className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hidden md:block">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-gray-900">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/orders" className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hidden md:block" title="My Orders">
                                    <Package className="h-5 w-5" />
                                    {activeOrderCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#2D5A27] dark:bg-green-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-gray-900">
                                            {activeOrderCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/cart" className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hidden md:block">
                                    <ShoppingCart className="h-5 w-5" />
                                    <CartBadge />
                                </Link>
                            </div>
                        )}

                        {/* Unified Menu Toggle */}
                        <div className="flex items-center space-x-2">
                            {user ? (
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="flex items-center space-x-2 p-1 sm:p-1.5 pr-2 sm:pr-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-100 dark:border-gray-800 shadow-sm shrink-0"
                                    aria-label="Toggle Menu"
                                >
                                    {isOpen ? (
                                        <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                    ) : (
                                        <>
                                            <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-bold overflow-hidden relative shadow-inner">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" />
                                                ) : (
                                                    (user.displayName || "U").charAt(0).toUpperCase()
                                                )}
                                                {isProfileIncomplete && (
                                                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="hidden lg:block font-semibold text-sm">
                                                    Hi, {user.displayName?.split(" ")[0] || "User"}
                                                </span>
                                                <Menu className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <Link href={pathname === "/login" ? "/login" : `/login?redirect=${pathname}`} className="flex items-center space-x-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-green-700 transition-colors shrink-0">
                                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span>Login</span>
                                    </Link>
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative"
                                        aria-label="Toggle Menu"
                                    >
                                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                        {!isOpen && hasIndicator && (
                                            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Dropdown/Mobile Menu */}
                        {isOpen && (
                            <div
                                ref={mobileMenuRef}
                                className="absolute top-full right-0 w-screen sm:w-80 lg:w-64 mt-1 lg:mt-2 bg-white dark:bg-gray-900 lg:rounded-2xl shadow-xl lg:shadow-2xl border-t lg:border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300 z-50 overflow-hidden"
                            >
                                <div className="p-4 space-y-4">
                                    {/* Mobile Quick Links (Hidden on desktop as they are in navbar) */}
                                    {user && (
                                        <div className="lg:hidden grid grid-cols-5 gap-2 pb-4 border-b border-gray-50 dark:border-gray-800">
                                            <Link
                                                href="/shop"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors relative"
                                            >
                                                <Store className="h-6 w-6 mb-1" />
                                                <span className="text-[10px] font-medium">Shop</span>
                                            </Link>
                                            <Link
                                                href="/cart"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors relative"
                                            >
                                                <ShoppingCart className="h-6 w-6 mb-1" />
                                                <span className="text-[10px] font-medium">Cart</span>
                                                <CartBadge className="top-2 right-2" />
                                            </Link>
                                            <Link
                                                href="/orders"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors relative"
                                            >
                                                <Package className="h-6 w-6 mb-1" />
                                                <span className="text-[10px] font-medium">Orders</span>
                                                {activeOrderCount > 0 && (
                                                    <span className="absolute top-2 right-2 h-4 w-4 bg-[#2D5A27] dark:bg-green-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-gray-900">
                                                        {activeOrderCount}
                                                    </span>
                                                )}
                                            </Link>
                                            <Link
                                                href="/notifications"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors relative"
                                            >
                                                <Bell className="h-6 w-6 mb-1" />
                                                <span className="text-[10px] font-medium">Alerts</span>
                                                {unreadCount > 0 && (
                                                    <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-gray-900">
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                            </Link>
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsOpen(false)}
                                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors relative"
                                            >
                                                {user.photoURL ? (
                                                    <div className="h-6 w-6 mb-1 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                                        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <User className="h-6 w-6 mb-1" />
                                                )}
                                                <span className="text-[10px] font-medium">Profile</span>
                                                {isProfileIncomplete && (
                                                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
                                                )}
                                            </Link>
                                        </div>
                                    )}

                                    {/* Navigation Links */}
                                    <div className="space-y-1">
                                        {/* Desktop Only Links */}
                                        {user && (
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsOpen(false)}
                                                className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <User className="h-4 w-4" />
                                                My Profile
                                            </Link>
                                        )}

                                        <div className="lg:hidden px-4 py-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                                            <ThemeToggle />
                                        </div>

                                        {/* Dashboard Link (Always show if admin) */}
                                        {(dbUser?.role === 'admin' || dbUser?.role === 'manager') && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 lg:py-2.5 rounded-xl lg:rounded-lg text-base lg:text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm lg:mb-1"
                                            >
                                                <LayoutDashboard className="h-5 w-5 lg:h-4 w-4" />
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        {/* Mobile Only Navigation Links (Hidden on desktop as they are in top navbar) */}
                                        <div className="lg:hidden space-y-1">
                                            {links.map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={clsx(
                                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                                                        isActive(link.href)
                                                            ? "bg-[#2D5A27]/10 dark:bg-green-900/20 text-[#2D5A27] dark:text-green-400 font-semibold"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#2D5A27] dark:hover:text-green-400"
                                                    )}
                                                >
                                                    <link.icon className="h-5 w-5" />
                                                    {link.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Logout Button (Always available in menu) */}
                                    {user && (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                logout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 lg:py-2.5 rounded-xl lg:rounded-lg text-base lg:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t lg:border-none border-gray-50 dark:border-gray-800 mt-2 lg:mt-1 pt-4 lg:pt-2.5"
                                        >
                                            <LogOut className="h-5 w-5 lg:h-4 lg:w-4" />
                                            Logout
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
