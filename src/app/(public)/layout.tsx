import Navbar from "@/components/layout/Navbar";
import FooterWrapper from "@/components/layout/FooterWrapper";
import FloatingCheckoutButton from "@/components/ui/FloatingCheckoutButton";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <FooterWrapper />

            {/* Floating Checkout Button for Mobile - Persists across all pages */}
            <FloatingCheckoutButton />
        </>
    );
}
