import { useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

interface SearchInputProps {
    className?: string;
    onFocus?: () => void;
}

export default function SearchInput({ className, onFocus }: SearchInputProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            router.push("/shop");
        }
    };

    return (
        <form onSubmit={handleSearch} className={clsx("relative w-full max-w-sm", className)}>
            <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={onFocus}
                className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-gray-50 text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-4 w-4" />
            </div>
            {searchTerm && (
                <button
                    type="button"
                    onClick={() => {
                        setSearchTerm("");
                        router.push("/shop");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </form>
    );
}
