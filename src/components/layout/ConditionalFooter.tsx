"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
    const pathname = usePathname();
    const isAdminPath = pathname.startsWith("/admin");

    if (isAdminPath) {
        return null;
    }

    return <Footer />;
}
