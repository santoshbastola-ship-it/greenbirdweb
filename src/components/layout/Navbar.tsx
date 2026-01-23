"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingCart, User, X, Sprout } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import CartBadge from "./CartBadge";

import CheckoutButton from "./CheckoutButton";

import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user, dbUser, logout } = useAuth();

    const links = [
        { href: "/", label: "Home" },
        { href: "/shop", label: "Shop" },
        { href: "/about", label: "Our Story" },
        { href: "/blog", label: "Blog" },
        { href: "/contact", label: "Contact Us" },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <img
                            src="/images/logo.png"
                            alt="Greenbird Homestead"
                            className="h-16 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex space-x-8">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={clsx(
                                    "text-sm font-medium transition-colors duration-200",
                                    isActive(link.href)
                                        ? "text-[#2D5A27]"
                                        : "text-gray-600 hover:text-[#2D5A27]"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {(dbUser?.role === 'admin' || dbUser?.role === 'manager') && (
                            <Link
                                href="/admin"
                                className={clsx(
                                    "text-sm font-medium transition-colors duration-200",
                                    isActive("/admin")
                                        ? "text-green-600"
                                        : "text-green-600 hover:text-green-700"
                                )}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center space-x-4">
                        <CheckoutButton />
                        <Link href="/cart" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <ShoppingCart className="h-5 w-5" />
                            <CartBadge />
                        </Link>

                        {user ? (
                            <div className="relative group">
                                <button className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold overflow-hidden">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || "User"} className="h-full w-full object-cover" />
                                        ) : (
                                            (user.displayName || "U").charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="hidden md:block font-medium text-sm">
                                        Hi, {user.displayName?.split(" ")[0] || "User"}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all transform origin-top-right z-50">
                                    <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                                        <p className="text-sm font-bold text-gray-900">{user.displayName || "User"}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>

                                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                                        My Profile
                                    </Link>
                                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                                        My Orders
                                    </Link>
                                    {(dbUser?.role === 'admin' || dbUser?.role === 'manager') && (
                                        <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => logout()}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link href="/login" className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">
                                <User className="h-4 w-4" />
                                <span>Login</span>
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={clsx(
                                    "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                                    isActive(link.href)
                                        ? "bg-[#2D5A27]/10 text-[#2D5A27]"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#2D5A27]"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
