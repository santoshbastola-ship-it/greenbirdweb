"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingCart, User, X, Sprout } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import CartBadge from "./CartBadge";

import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user, dbUser } = useAuth();

    const links = [
        { href: "/", label: "Home" },
        { href: "/shop", label: "Shop" },
        { href: "/about", label: "About Farm" },
        { href: "/blog", label: "Blog" },
        { href: "/contact", label: "Contact Us" },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <img
                            src="/images/logo.jpg"
                            alt="Greenbird Homestead"
                            className="h-12 w-auto object-contain"
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
                        <Link href="/cart" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <ShoppingCart className="h-5 w-5" />
                            <CartBadge />
                        </Link>
                        <Link href={user ? "/orders" : "/login"} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <User className="h-5 w-5" />
                        </Link>

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
                        {(dbUser?.role === 'admin' || dbUser?.role === 'manager') && (
                            <Link
                                href="/admin"
                                onClick={() => setIsOpen(false)}
                                className={clsx(
                                    "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                                    isActive("/admin")
                                        ? "bg-green-100 text-green-700"
                                        : "text-green-600 hover:bg-green-50"
                                )}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
