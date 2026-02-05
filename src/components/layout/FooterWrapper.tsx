"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
    const pathname = usePathname();
    const isCartPage = pathname === "/cart";
    const isProductPage = pathname.startsWith("/shop/") && pathname !== "/shop";

    return <Footer minimized={isCartPage || isProductPage} />;
}
