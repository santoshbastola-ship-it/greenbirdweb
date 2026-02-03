import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types';
import { ProductService } from '@/services/product.service';
import { Search, X, Plus } from 'lucide-react';

interface RelatedProductsSelectorProps {
    currentProductId?: string;
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export default function RelatedProductsSelector({ currentProductId, selectedIds, onChange }: RelatedProductsSelectorProps) {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            // Ideally we should cache this or use a search endpoint, but for small catalog getAll is fine
            const products = await ProductService.getAllProducts();
            setAllProducts(products.filter(p => p.id !== currentProductId));
        };
        fetchProducts();
    }, [currentProductId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredProducts = allProducts.filter(product =>
        !selectedIds.includes(product.id) &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedProducts = allProducts.filter(product => selectedIds.includes(product.id));

    const handleSelect = (productId: string) => {
        onChange([...selectedIds, productId]);
        setSearchTerm("");
    };

    const handleRemove = (productId: string) => {
        onChange(selectedIds.filter(id => id !== productId));
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Frequently Bought Together</label>

            {/* Selected Pills */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedProducts.map(product => (
                    <div key={product.id} className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-100">
                        <span>{product.name}</span>
                        <button
                            type="button"
                            onClick={() => handleRemove(product.id)}
                            className="hover:text-red-500 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Search Input & Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search products to recommend..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                {/* Dropdown Results */}
                {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">No matching products found</div>
                        ) : (
                            filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => handleSelect(product.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                            {product.images?.[0] && (
                                                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{product.businessType}</p>
                                        </div>
                                    </div>
                                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500">Select products that act as complements (e.g., Mint for Tea).</p>
        </div>
    );
}
