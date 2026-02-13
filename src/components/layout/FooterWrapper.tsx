"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
    const pathname = usePathname();
    // List of paths where the footer should be hidden completely
    const hiddenPaths = ['/cart', '/orders', '/notifications', '/profile', '/blog', '/shop'];
    const shouldHide = hiddenPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (shouldHide) return null;

    return <Footer />;
}
