"use client";

import { Suspense } from 'react';
import PartnerDetailsClient from "./PartnerDetailsClient";
import LogoLoader from "@/components/ui/LogoLoader";

export default function PartnerDetailsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <LogoLoader />
            </div>
        }>
            <PartnerDetailsClient />
        </Suspense>
    );
}
