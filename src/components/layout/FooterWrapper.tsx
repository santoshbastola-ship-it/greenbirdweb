"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
    const pathname = usePathname();
    const isCartPage = pathname === "/cart";

    return <Footer minimized={isCartPage} />;
}
