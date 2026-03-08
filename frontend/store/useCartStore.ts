import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartOption {
    optionGroupId: number;
    optionGroupName: string;
    optionItemId: number;
    optionItemName: string;
    priceDelta: number;
}

export interface CartItem {
    cartId: string; // Unique ID for the cart item (a combination of menuId and options or UUID)
    menuId: number;
    menuName: string;
    menuEngName: string;
    imageSrc: string;
    basePrice: number;
    quantity: number;
    selectedOptions: CartOption[];
    optionTotalPrice: number;
    subtotal: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (newItem) => {
                set((state) => {
                    // Check if an item with the same menuId and options already exists
                    const existingItemIndex = state.items.findIndex((item) => {
                        if (item.menuId !== newItem.menuId) return false;
                        if (item.selectedOptions.length !== newItem.selectedOptions.length) return false;

                        // Note: Simplistic option comparison. Sorting/hashing might be needed if order isn't guaranteed
                        const optionsMatch = item.selectedOptions.every(opt =>
                            newItem.selectedOptions.some(newOpt =>
                                newOpt.optionGroupId === opt.optionGroupId && newOpt.optionItemId === opt.optionItemId
                            )
                        );
                        return optionsMatch;
                    });

                    if (existingItemIndex > -1) {
                        // Update existing item's quantity
                        const updatedItems = [...state.items];
                        const existingItem = updatedItems[existingItemIndex];
                        const newQuantity = existingItem.quantity + newItem.quantity;
                        updatedItems[existingItemIndex] = {
                            ...existingItem,
                            quantity: newQuantity,
                            subtotal: (existingItem.basePrice + existingItem.optionTotalPrice) * newQuantity
                        };
                        return { items: updatedItems };
                    } else {
                        return { items: [...state.items, newItem] };
                    }
                });
            },
            removeItem: (cartId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.cartId !== cartId),
                }));
            },
            updateQuantity: (cartId, quantity) => {
                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.cartId === cartId) {
                            const newQuantity = Math.max(1, quantity);
                            return {
                                ...item,
                                quantity: newQuantity,
                                subtotal: (item.basePrice + item.optionTotalPrice) * newQuantity
                            };
                        }
                        return item;
                    }),
                }));
            },
            clearCart: () => {
                set({ items: [] });
            },
            getTotalPrice: () => {
                return get().items.reduce((total, item) => total + item.subtotal, 0);
            },
            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },
        }),
        {
            name: 'ncafe-cart-storage',
        }
    )
);
