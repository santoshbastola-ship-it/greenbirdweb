import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { ProductService } from '@/services/product.service';

export function useRecommendations() {
    const { items: cartItems } = useCartStore();
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                let products: Product[] = [];

                if (cartItems.length === 0) {
                    // Method 1: No items in cart -> Show Featured
                    products = await ProductService.getFeaturedProducts();
                } else {
                    // Method 2: Hybrid Approach (Manual Links + Category Fallback)
                    const lastItem = cartItems[cartItems.length - 1];
                    const fullLastProduct = await ProductService.getProductById(lastItem.productId);

                    // 2a. Fetch Manual Links
                    if (fullLastProduct?.relatedProductIds && fullLastProduct.relatedProductIds.length > 0) {
                        const relatedPromises = fullLastProduct.relatedProductIds.map(id => ProductService.getProductById(id));
                        const relatedResults = await Promise.all(relatedPromises);
                        products = relatedResults.filter((p): p is Product => p !== null);
                    }

                    // 2b. Fill/Fallback with Category items if we have fewer than 4 items
                    if (products.length < 4 && lastItem.businessType) {
                        const categoryProducts = await ProductService.getProductsByCategory(lastItem.businessType);

                        // Add category products that aren't already in the manual list
                        const existingIds = new Set(products.map(p => p.id));
                        for (const p of categoryProducts) {
                            if (!existingIds.has(p.id) && products.length < 10) { // Fetch a bit more to filter later
                                products.push(p);
                                existingIds.add(p.id);
                            }
                        }
                    } else if (products.length < 4) {
                        // Fallback if no category info
                        const featured = await ProductService.getFeaturedProducts();
                        const existingIds = new Set(products.map(p => p.id));
                        for (const p of featured) {
                            if (!existingIds.has(p.id)) {
                                products.push(p);
                                existingIds.add(p.id);
                            }
                        }
                    }
                }

                // Filter out items already in the cart to avoid recommending what they just bought/added
                const cartProductIds = new Set(cartItems.map(item => item.productId));
                const filtered = products.filter(p =>
                    !cartProductIds.has(p.id) &&
                    p.currentStock > 0 && // Only show in-stock products
                    p.showInApp !== false // Only show products marked as visible in app
                );

                // Limit to 4 items for the UI
                setRecommendations(filtered.slice(0, 4));
            } catch (error) {
                console.error("Failed to fetch recommendations", error);
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [cartItems]); // Re-run when cart changes

    return { recommendations, loading };
}
