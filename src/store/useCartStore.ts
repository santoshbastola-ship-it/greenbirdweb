import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, Product } from "@/types";

interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
}

import { calculateProductPrice } from "@/lib/product-helper";

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,

            addItem: (product, quantity) => {
                const currentItems = get().items;
                const existingItem = currentItems.find((item) => item.productId === product.id);
                const { finalPrice, originalPrice, discountAmount } = calculateProductPrice(product);

                if (existingItem) {
                    const updatedItems = currentItems.map((item) =>
                        item.productId === product.id
                            ? {
                                ...item,
                                quantity: item.quantity + quantity,
                                price: finalPrice,
                                originalPrice: originalPrice,
                                discount: discountAmount,
                                priceUnit: product.priceUnit
                            }
                            : item
                    );
                    set({ items: updatedItems });
                } else {
                    const newItem: CartItem = {
                        productId: product.id,
                        productName: product.name,
                        price: finalPrice,
                        originalPrice: originalPrice,
                        discount: discountAmount,
                        quantity: quantity,
                        unit: product.unit,
                        priceUnit: product.priceUnit,
                        imageUrl: product.images && product.images.length > 0 ? product.images[0] : "/placeholder.png",
                        availableStock: product.currentStock,
                        businessType: product.businessType,
                    };
                    set({ items: [...currentItems, newItem] });
                }
            },

            removeItem: (productId) => {
                set({ items: get().items.filter((item) => item.productId !== productId) });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.productId === productId ? { ...item, quantity } : item
                    ),
                });
            },

            clearCart: () => set({ items: [] }),
        }),
        {
            name: "greenbird-cart",
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Filter out invalid items during hydration
                    const validItems = state.items.filter(
                        (item) => item && item.productId && item.unit
                    );
                    // Migrate old cart items that don't have priceUnit
                    const migratedItems = validItems.map(item => {
                        if (!item.priceUnit) {
                            return { ...item, priceUnit: item.unit };
                        }
                        return item;
                    });

                    // Check if migration is needed
                    const needsMigration = migratedItems.length !== state.items.length ||
                        migratedItems.some((item, idx) => item.priceUnit !== state.items[idx]?.priceUnit);

                    if (needsMigration) {
                        // Update state to trigger persistence
                        state.items = migratedItems;
                        // Force a re-save to localStorage by returning the migration function
                        return () => {
                            // This callback runs after hydration and will trigger a save
                            setTimeout(() => {
                                const store = useCartStore.getState();
                                store.items = migratedItems;
                            }, 0);
                        };
                    }
                }
            },
        }
    )
);
