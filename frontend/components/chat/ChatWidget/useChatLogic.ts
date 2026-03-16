'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/useChatStore';
import { useCartStore, CartOption } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { OptionGroup } from '@/types/menuOption';

export interface MenuCardData {
    slug: string;
    name: string;
    price: number;
}

export interface OptionPanelData {
    menuId: number;
    menuName: string;
    menuEngName: string;
    imageSrc: string;
    basePrice: number;
    quantity: number;
    optionGroups: OptionGroup[];
    purpose: 'cart' | 'favorite';
}

export const useChatLogic = () => {
    const {
        messages,
        isOpen,
        isLoading,
        toggleChat,
        closeChat,
        sendMessage,
        pendingAction,
        clearPendingAction,
        clearMessages,
    } = useChatStore();

    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const checkAuth = useAuthStore((state) => state.checkAuth);
    const items = useCartStore((state) => state.items);
    const addItem = useCartStore((state) => state.addItem);

    const [input, setInput] = useState('');
    const [menuCards, setMenuCards] = useState<MenuCardData[]>([]);
    const [optionPanel, setOptionPanel] = useState<OptionPanelData | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});

    // 옵션 패널 열기
    const openOptionPanel = async (slug: string, quantity: number = 1, purpose: 'cart' | 'favorite' = 'cart') => {
        try {
            const res = await fetch(`/api/menus/slug/${slug}`);
            if (!res.ok) return;
            const text = await res.text();
            if (!text) return;
            const menu = JSON.parse(text);

            const optRes = await fetch(`/api/menus/${menu.id}/options`);
            let optionGroups: OptionGroup[] = [];
            if (optRes.ok) {
                const optData = await optRes.json();
                optionGroups = optData.optionGroups || [];
            }

            const defaults: Record<number, number[]> = {};
            optionGroups.forEach((g) => {
                if (g.isRequired && g.items?.length > 0) {
                    defaults[g.id] = [g.items[0].id];
                }
            });
            setSelectedOptions(defaults);

            if (optionGroups.length === 0) {
                if (purpose === 'cart') {
                    const cartId = `${menu.id}-`;
                    addItem({
                        cartId,
                        menuId: menu.id,
                        menuName: menu.korName,
                        menuEngName: menu.engName,
                        imageSrc: menu.images && menu.images.length > 0 ? menu.images[0].srcUrl : '',
                        basePrice: menu.price,
                        quantity,
                        selectedOptions: [],
                        optionTotalPrice: 0,
                        subtotal: menu.price * quantity,
                    });
                } else if (purpose === 'favorite') {
                    try {
                        const favRes = await fetch('/api/users/me/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ menuId: menu.id, selectedOptions: [], alias: '' })
                        });
                        if (favRes.ok) {
                            alert(`${menu.korName} 메뉴가 즐겨찾기에 등록되었습니다!`);
                        } else {
                            alert('즐겨찾기 추가 중 오류가 발생했습니다.');
                        }
                    } catch (err) {
                        console.error('Add favorite failed', err);
                    }
                }
                return;
            }

            setOptionPanel({
                menuId: menu.id,
                menuName: menu.korName,
                menuEngName: menu.engName,
                imageSrc: menu.images && menu.images.length > 0 ? menu.images[0].srcUrl : '',
                basePrice: menu.price,
                quantity,
                optionGroups,
                purpose,
            });
        } catch (e) {
            console.error('Failed to load menu options', e);
        }
    };

    // 옵션 변경
    const handleOptionChange = (group: OptionGroup, itemId: number, checked: boolean) => {
        setSelectedOptions((prev) => {
            const copy = { ...prev };
            if (group.type === 'radio') {
                copy[group.id] = [itemId];
            } else {
                const current = copy[group.id] || [];
                copy[group.id] = checked
                    ? [...current, itemId]
                    : current.filter((id) => id !== itemId);
            }
            return copy;
        });
    };

    // 장바구니 담기
    const handleAddFromPanel = () => {
        if (!optionPanel) return;

        const cartOptions: CartOption[] = [];
        let optionTotalPrice = 0;

        optionPanel.optionGroups.forEach((group) => {
            const selectedIds = selectedOptions[group.id] || [];
            group.items?.forEach((item) => {
                if (selectedIds.includes(item.id)) {
                    cartOptions.push({
                        optionGroupId: group.id,
                        optionGroupName: group.name,
                        optionItemId: item.id,
                        optionItemName: item.name,
                        priceDelta: item.priceDelta || 0,
                    });
                    optionTotalPrice += item.priceDelta || 0;
                }
            });
        });

        const cartId = `${optionPanel.menuId}-${cartOptions.map(o => `${o.optionGroupId}:${o.optionItemId}`).sort().join('-')}`;
        addItem({
            cartId,
            menuId: optionPanel.menuId,
            menuName: optionPanel.menuName,
            menuEngName: optionPanel.menuEngName,
            imageSrc: optionPanel.imageSrc,
            basePrice: optionPanel.basePrice,
            quantity: optionPanel.quantity,
            selectedOptions: cartOptions,
            optionTotalPrice,
            subtotal: (optionPanel.basePrice + optionTotalPrice) * optionPanel.quantity,
        });

        setOptionPanel(null);
        setSelectedOptions({});
    };

    // 즐겨찾기 추가
    const handleAddFavoriteFromPanel = async () => {
        if (!optionPanel || !user) return;

        const payloadOptions: { optionGroupId: number; optionItemId: number }[] = [];
        optionPanel.optionGroups.forEach((group) => {
            const ids = selectedOptions[group.id] || [];
            ids.forEach((id) => {
                payloadOptions.push({ optionGroupId: group.id, optionItemId: id });
            });
        });

        try {
            const res = await fetch('/api/users/me/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuId: optionPanel.menuId, selectedOptions: payloadOptions, alias: '' })
            });
            if (res.ok) {
                alert(`${optionPanel.menuName} 메뉴가 즐겨찾기에 등록되었습니다!`);
            } else {
                alert('즐겨찾기 추가 중 오류가 발생했습니다.');
            }
        } catch (err) {
            console.error(err);
        }

        setOptionPanel(null);
        setSelectedOptions({});
    };

    // 옵션 총 가격
    const getOptionTotalPrice = () => {
        if (!optionPanel) return 0;
        let total = 0;
        optionPanel.optionGroups.forEach((group) => {
            const ids = selectedOptions[group.id] || [];
            group.items?.forEach((item) => {
                if (ids.includes(item.id)) total += item.priceDelta || 0;
            });
        });
        return total;
    };

    // 에이전트 액션 처리
    useEffect(() => {
        if (!pendingAction) return;

        if (pendingAction.type === 'navigate') {
            router.push(pendingAction.path);
            clearPendingAction();
        } else if (pendingAction.type === 'add_to_cart') {
            openOptionPanel(pendingAction.slug, pendingAction.quantity, 'cart').finally(clearPendingAction);
        } else if (pendingAction.type === 'open_favorite_panel') {
            openOptionPanel(pendingAction.slug, 1, 'favorite').finally(clearPendingAction);
        } else if (pendingAction.type === 'show_menu_cards') {
            setMenuCards(pendingAction.menus);
            clearPendingAction();
        } else if (pendingAction.type === 'reorder') {
            const reorder = async () => {
                for (const item of pendingAction.items) {
                    try {
                        const res = await fetch(`/api/menus/${item.menuId}`);
                        if (res.ok) {
                            const menu = await res.json();
                            const slug = (menu.engName || '').toLowerCase().replace(/\s+/g, '-');
                            if (slug) await openOptionPanel(slug, item.quantity, 'cart');
                        }
                    } catch (e) {
                        console.error('Reorder item failed', e);
                    }
                }
            };
            reorder().finally(clearPendingAction);
        }
    }, [pendingAction, router, clearPendingAction, addItem]);

    const getUserId = () => user?.id || null;
    const getCartSummary = () => {
        if (items.length === 0) return null;
        return items.map(i => `${i.menuName} ×${i.quantity}`).join(', ');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        setInput('');
        setMenuCards([]);
        await sendMessage(trimmed, getUserId(), getCartSummary());
    };

    const handleFAQClick = async (question: string) => {
        if (isLoading) return;
        setMenuCards([]);
        await sendMessage(question, getUserId(), getCartSummary());
    };

    const handleMenuCardClick = (slug: string) => {
        router.push(`/menus/${slug}`);
    };

    const handleMenuCardAddToCart = async (slug: string) => {
        await openOptionPanel(slug);
    };

    const closeOptionPanel = () => {
        setOptionPanel(null);
        setSelectedOptions({});
    };

    const resetChat = () => {
        clearMessages();
        setMenuCards([]);
        setOptionPanel(null);
    };

    return {
        messages, isOpen, isLoading, input, menuCards, optionPanel, selectedOptions,
        toggleChat, closeChat, setInput,
        handleSubmit, handleFAQClick, handleMenuCardClick, handleMenuCardAddToCart,
        handleOptionChange, handleAddFromPanel, handleAddFavoriteFromPanel,
        getOptionTotalPrice, closeOptionPanel, resetChat, checkAuth,
    };
};
