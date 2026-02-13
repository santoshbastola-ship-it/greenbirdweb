"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, ShoppingCart, User, X, Sprout, Bell, Truck, Package, Store, LogOut, LayoutDashboard, Home, BookOpen, FileText, Phone } from "lucide-react";
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
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
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
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
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
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center relative">
                    {/* Logo */}
                    <Link href="/" className={clsx("flex items-center shrink-0", isSearchOpen && "hidden md:flex")}>
                        <img
                            src="/images/logo.png"
                            alt="Greenbird Homestead"
                            className="h-10 sm:h-12 md:h-16 w-auto object-contain"
                        />
                    </Link>

                    {/* Search Field - Visible on all screens */}
                    <div className={clsx(
                        "flex-1 mx-2 md:mx-4 transition-all duration-300",
                        isSearchOpen
                            ? "absolute inset-0 z-50 bg-white px-4 flex items-center justify-center md:relative md:bg-transparent md:inset-auto md:max-w-xl md:justify-start"
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
                                        ? "text-[#2D5A27] border-[#2D5A27]"
                                        : "text-gray-600 border-transparent hover:text-[#2D5A27] hover:border-[#2D5A27]/30"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Icons */}
                    <div className={clsx("flex items-center space-x-2 sm:space-x-3", isSearchOpen && "hidden md:flex")}>
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
                                <Link href="/notifications" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hidden md:block">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/orders" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hidden md:block" title="My Orders">
                                    <Package className="h-5 w-5" />
                                    {activeOrderCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#2D5A27] text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                            {activeOrderCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/cart" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hidden md:block">
                                    <ShoppingCart className="h-5 w-5" />
                                    <CartBadge />
                                </Link>
                            </div>
                        )}

                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-2 p-1.5 pr-3 text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 hidden md:flex border border-gray-100 shadow-sm"
                                >
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold overflow-hidden relative shadow-inner">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" />
                                        ) : (
                                            (user.displayName || "U").charAt(0).toUpperCase()
                                        )}
                                        {isProfileIncomplete && (
                                            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                                        )}
                                    </div>
                                    <span className="hidden lg:block font-semibold text-sm">
                                        Hi, {user.displayName?.split(" ")[0] || "User"}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 transition-all transform origin-top-right z-50">
                                        <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                                            <p className="text-sm font-bold text-gray-900">{user.displayName || "User"}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>

                                        <Link
                                            href="/profile"
                                            className="px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center justify-between"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <span>My Profile</span>
                                            {isProfileIncomplete && (
                                                <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                                            )}
                                        </Link>
                                        {dbUser?.role !== 'admin' && (
                                            <Link
                                                href="/orders"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                My Orders
                                            </Link>
                                        )}
                                        {(dbUser?.role === 'admin' || dbUser?.role === 'manager') && (
                                            <Link
                                                href="/admin"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                logout();
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="flex items-center space-x-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-green-700 transition-colors shrink-0">
                                <User className="h-3 w-3 sm:h-4 sm:h-4" />
                                <span className="hidden sm:inline">Login</span>
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative"
                            aria-label="Toggle Menu"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            {!isOpen && hasIndicator && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div
                    ref={mobileMenuRef}
                    className="lg:hidden border-t border-gray-100 bg-white shadow-xl animate-in slide-in-from-top duration-300"
                >
                    <div className="px-4 pt-4 pb-6 space-y-4">
                        {/* Mobile Quick Links (Previously hidden from navbar) */}
                        {user && (
                            <div className="grid grid-cols-5 gap-2 pb-4 border-b border-gray-50">
                                <Link
                                    href="/shop"
                                    onClick={() => setIsOpen(false)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors relative"
                                >
                                    <Store className="h-6 w-6 mb-1" />
                                    <span className="text-[10px] font-medium">Shop</span>
                                </Link>
                                <Link
                                    href="/cart"
                                    onClick={() => setIsOpen(false)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors relative"
                                >
                                    <ShoppingCart className="h-6 w-6 mb-1" />
                                    <span className="text-[10px] font-medium">Cart</span>
                                    <CartBadge className="top-2 right-2" />
                                </Link>
                                <Link
                                    href="/orders"
                                    onClick={() => setIsOpen(false)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors relative"
                                >
                                    <Package className="h-6 w-6 mb-1" />
                                    <span className="text-[10px] font-medium">Orders</span>
                                    {activeOrderCount > 0 && (
                                        <span className="absolute top-2 right-2 h-4 w-4 bg-[#2D5A27] text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                            {activeOrderCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors relative"
                                >
                                    <Bell className="h-6 w-6 mb-1" />
                                    <span className="text-[10px] font-medium">Alerts</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsOpen(false)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors relative"
                                >
                                    {user.photoURL ? (
                                        <div className="h-6 w-6 mb-1 rounded-full overflow-hidden border border-gray-200">
                                            <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                        </div>
                                    ) : (
                                        <User className="h-6 w-6 mb-1" />
                                    )}
                                    <span className="text-[10px] font-medium">Profile</span>
                                    {isProfileIncomplete && (
                                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                                    )}
                                </Link>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <div className="space-y-1">
                            {(dbUser?.role === 'admin' || dbUser?.role === 'manager') && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors bg-green-600 text-white shadow-sm hover:bg-green-700 mb-2"
                                    )}
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    Admin Dashboard
                                </Link>
                            )}
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                                        isActive(link.href)
                                            ? "bg-[#2D5A27]/10 text-[#2D5A27] font-semibold"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-[#2D5A27]"
                                    )}
                                >
                                    <link.icon className="h-5 w-5" />
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Logout for mobile menu */}
                        {user && (
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
