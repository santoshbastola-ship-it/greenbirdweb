import LogoLoader from "@/components/ui/LogoLoader";

export default function Loading() {
    return (
        <div className="flex-grow flex items-center justify-center min-h-[50vh]">
            <LogoLoader size="lg" />
        </div>
    );
}
