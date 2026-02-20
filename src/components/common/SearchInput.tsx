import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ProductService } from "@/services/product.service";

interface SearchResult {
    id: string;
    name: string;
    category: string;
    image: string;
    price: number;
    unit: string;
    slug: string;
}

interface SearchInputProps {
    className?: string;
    onFocus?: () => void;
}

export default function SearchInput({ className, onFocus }: SearchInputProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length >= 2) {
                setIsLoading(true);
                try {
                    const results = await ProductService.searchProducts(searchTerm);
                    setSuggestions(results);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsOpen(false);
        if (searchTerm.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            router.push("/shop");
        }
    };

    const handleSuggestionClick = (product: SearchResult) => {
        setSearchTerm(product.name);
        setIsOpen(false);
        // Use query param to avoid 404 for new products in static export
        router.push(`/shop?view=${product.id}`);
    };

    return (
        <div ref={wrapperRef} className={clsx("relative w-full", className)}>
            <form onSubmit={handleSearch} className="relative w-full">
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        if (onFocus) onFocus();
                        if (suggestions.length > 0) setIsOpen(true);
                    }}
                    className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                </div>
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm("");
                            setIsOpen(false);
                            router.push("/shop");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </form>

            {/* Suggestions Dropdown */}
            {isOpen && (suggestions.length > 0 || isLoading) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                    ) : (
                        <ul>
                            {suggestions.map((product) => (
                                <li key={product.id}>
                                    <button
                                        onClick={() => handleSuggestionClick(product)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                    >
                                        <div className="h-10 w-10 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {product.name}
                                                </p>
                                                <p className="text-sm font-bold text-[#2D5A27] dark:text-green-400 whitespace-nowrap">
                                                    Rs. {product.price}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {product.category}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
