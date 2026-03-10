'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MenuDetailResponse, MenuOptionsResponse, OptionGroup } from '../types';
import { useCartStore, CartOption } from '@/store/useCartStore';

export function useMenuDetail(id: number) {
    const router = useRouter();
    const [menu, setMenu] = useState<MenuDetailResponse | null>(null);
    const [optionsData, setOptionsData] = useState<MenuOptionsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStoreOpen, setIsStoreOpen] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});

    const [quantity, setQuantity] = useState(1);
    const addItemToCart = useCartStore((state) => state.addItem);

    useEffect(() => {
        const fetchMenuAndOptions = async () => {
            setIsLoading(true);
            try {
                const [menuRes, optionsRes, storeRes] = await Promise.all([
                    fetch(`/api/menus/${id}`),
                    fetch(`/api/menus/${id}/options`),
                    fetch('/api/store/status')
                ]);

                if (!menuRes.ok) throw new Error('메뉴를 불러오는 데 실패했습니다.');
                if (!optionsRes.ok) throw new Error('옵션을 불러오는 데 실패했습니다.');

                const menuData = await menuRes.json();
                const optData: MenuOptionsResponse = await optionsRes.json();

                setMenu(menuData);
                setOptionsData(optData);

                if (storeRes.ok) {
                    const storeData = await storeRes.json();
                    setIsStoreOpen(storeData.isOpen);
                }

                const initialSelections: Record<number, number[]> = {};
                optData.optionGroups?.forEach((group) => {
                    if (group.isRequired && group.type === 'radio' && group.items?.length > 0) {
                        initialSelections[group.id] = [group.items[0].id];
                    } else {
                        initialSelections[group.id] = [];
                    }
                });
                setSelectedOptions(initialSelections);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMenuAndOptions();
    }, [id]);

    const handleOptionChange = (group: OptionGroup, itemId: number, checked: boolean) => {
        setSelectedOptions((prev) => {
            const currentSelected = prev[group.id] || [];
            if (group.type === 'radio') {
                return { ...prev, [group.id]: [itemId] };
            } else {
                if (checked) {
                    return { ...prev, [group.id]: [...currentSelected, itemId] };
                } else {
                    return { ...prev, [group.id]: currentSelected.filter((i) => i !== itemId) };
                }
            }
        });
    };

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity < 1) return;
        setQuantity(newQuantity);
    };

    const isOrderable = useMemo(() => {
        if (!optionsData?.optionGroups) return true;
        for (const group of optionsData.optionGroups) {
            if (group.isRequired) {
                const selections = selectedOptions[group.id] || [];
                if (selections.length === 0) return false;
            }
        }
        return true;
    }, [optionsData, selectedOptions]);

    const unitPrice = useMemo(() => {
        if (!menu) return 0;
        let total = menu.price;
        if (optionsData?.optionGroups) {
            optionsData.optionGroups.forEach((group) => {
                const selections = selectedOptions[group.id] || [];
                group.items?.forEach((item) => {
                    if (selections.includes(item.id)) {
                        total += item.priceDelta || 0;
                    }
                });
            });
        }
        return total;
    }, [menu, optionsData, selectedOptions]);

    const totalPrice = useMemo(() => {
        return unitPrice * quantity;
    }, [unitPrice, quantity]);

    const handleAddToCart = () => {
        if (!menu || !isOrderable || !isStoreOpen) return false;

        const cartOptions: CartOption[] = [];
        let optionTotalPrice = 0;

        if (optionsData?.optionGroups) {
            optionsData.optionGroups.forEach((group) => {
                const selections = selectedOptions[group.id] || [];
                group.items?.forEach((item) => {
                    if (selections.includes(item.id)) {
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
        }

        const cartId = `${menu.id}-${cartOptions.map(o => `${o.optionGroupId}:${o.optionItemId}`).sort().join('-')}`;
        const imageSrcStr = menu.images && menu.images.length > 0 ? menu.images[0].srcUrl : '';

        addItemToCart({
            cartId,
            menuId: menu.id,
            menuName: menu.korName,
            menuEngName: menu.engName,
            imageSrc: imageSrcStr,
            basePrice: menu.price,
            quantity: quantity,
            selectedOptions: cartOptions,
            optionTotalPrice,
            subtotal: (menu.price + optionTotalPrice) * quantity
        });

        return true;
    };

    return {
        menu,
        optionsData,
        isLoading,
        error,
        isStoreOpen,
        selectedOptions,
        quantity,
        totalPrice,
        isOrderable,
        handleOptionChange,
        handleQuantityChange,
        handleAddToCart
    };
}
