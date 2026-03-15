import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OrderType = 'PICKUP' | 'STORE';


export interface CartOption {
    optionGroupId: number;
    optionGroupName: string;
    optionItemId: number;
    optionItemName: string;
    priceDelta: number;
}

export interface CartItem {
    cartId: string; // Unique ID for the cart item (a combination of menuId and options or UUID)
    stableId?: string; // A persistent ID for the component key to prevent unmounting during option changes
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
    orderType: OrderType;
    items: CartItem[];
    setOrderType: (type: OrderType) => void;
    addItem: (item: CartItem) => void;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    updateOptions: (cartId: string, options: CartOption[]) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            orderType: 'STORE',
            items: [],
            setOrderType: (type) => set({ orderType: type }),
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
                        const itemWithStableId = {
                            ...newItem,
                            stableId: newItem.stableId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        };
                        return { items: [...state.items, itemWithStableId] };
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
            updateOptions: (cartId, newOptions) => {
                set((state) => {
                    const itemToUpdate = state.items.find(i => i.cartId === cartId);
                    if (!itemToUpdate) return state;

                    const optionTotalPrice = newOptions.reduce((total, opt) => total + opt.priceDelta, 0);
                    const newCartId = `${itemToUpdate.menuId}-${newOptions.map(o => `${o.optionGroupId}:${o.optionItemId}`).sort().join('-')}`;

                    // If cartId didn't change, just update the options for this item
                    if (newCartId === cartId) {
                        return {
                            items: state.items.map(item =>
                                item.cartId === cartId
                                    ? {
                                        ...item,
                                        selectedOptions: newOptions,
                                        optionTotalPrice,
                                        subtotal: (item.basePrice + optionTotalPrice) * item.quantity
                                    }
                                    : item
                            )
                        };
                    }

                    // If cartId changed, check if an item with newCartId already exists
                    const existingItemIndex = state.items.findIndex(item => item.cartId === newCartId);

                    if (existingItemIndex > -1) {
                        // Merge current item into the existing one
                        const updatedItems = [...state.items];
                        const existingItem = updatedItems[existingItemIndex];
                        const newQuantity = existingItem.quantity + itemToUpdate.quantity;

                        updatedItems[existingItemIndex] = {
                            ...existingItem,
                            quantity: newQuantity,
                            subtotal: (existingItem.basePrice + existingItem.optionTotalPrice) * newQuantity
                        };

                        // Remove the old item
                        return { items: updatedItems.filter(item => item.cartId !== cartId) };
                    } else {
                        // Just update the item with new cartId and options
                        return {
                            items: state.items.map(item =>
                                item.cartId === cartId
                                    ? {
                                        ...item,
                                        cartId: newCartId,
                                        stableId: item.stableId || item.cartId,
                                        selectedOptions: newOptions,
                                        optionTotalPrice,
                                        subtotal: (item.basePrice + optionTotalPrice) * item.quantity
                                    }
                                    : item
                            )
                        };
                    }
                });
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
