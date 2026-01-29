import LogoLoader from "@/components/ui/LogoLoader";

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LogoLoader size="lg" />
        </div>
    );
}
