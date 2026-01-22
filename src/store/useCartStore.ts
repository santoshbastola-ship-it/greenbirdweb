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

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,

            addItem: (product, quantity) => {
                const currentItems = get().items;
                const existingItem = currentItems.find((item) => item.productId === product.id);

                if (existingItem) {
                    const updatedItems = currentItems.map((item) =>
                        item.productId === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                    set({ items: updatedItems });
                } else {
                    const newItem: CartItem = {
                        productId: product.id,
                        productName: product.name,
                        price: product.currentPrice,
                        quantity: quantity,
                        unit: product.unit,
                        imageUrl: product.images[0],
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
        }
    )
);
