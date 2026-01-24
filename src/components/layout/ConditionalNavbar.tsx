"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();
    const isAdminPath = pathname.startsWith("/admin");

    if (isAdminPath) {
        return null;
    }

    return <Navbar />;
}
