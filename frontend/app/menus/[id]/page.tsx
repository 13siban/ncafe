'use client';

import React, { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Coffee, ChevronLeft, UtensilsCrossed, Loader2, ShoppingBag } from 'lucide-react';
import styles from './page.module.css';
import { MenuOptionsResponse, OptionGroup } from '@/types/menuOption';
import { MenuResponse } from '@/components/menu/types';
import { useCartStore, CartOption } from '@/store/useCartStore';

interface MenuDetailResponse extends MenuResponse {
    images?: { id: number; srcUrl: string; }[];
}

export default function PublicMenuDetailPage({ params }: { params: Promise<{ id: number }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [menu, setMenu] = useState<MenuDetailResponse | null>(null);
    const [optionsData, setOptionsData] = useState<MenuOptionsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStoreOpen, setIsStoreOpen] = useState(false);

    const addItemToCart = useCartStore((state) => state.addItem);
    const totalItems = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

    // Selected options: { optionGroupId: [selectedItemIds] }
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});

    useEffect(() => {
        const fetchMenuAndOptions = async () => {
            setIsLoading(true);
            try {
                // Fetch Menu Detail
                const menuRes = await fetch(`/api/menus/${id}`);
                if (!menuRes.ok) throw new Error('메뉴를 불러오는 데 실패했습니다.');
                const menuData = await menuRes.json();
                setMenu(menuData);

                // Fetch Menu Options
                const optionsRes = await fetch(`/api/menus/${id}/options`);
                if (!optionsRes.ok) throw new Error('옵션을 불러오는 데 실패했습니다.');
                const optionsData: MenuOptionsResponse = await optionsRes.json();
                setOptionsData(optionsData);

                // Initialize default selections for 'radio' or 'required' options
                const initialSelections: Record<number, number[]> = {};
                optionsData.optionGroups?.forEach((group) => {
                    if (group.isRequired && group.type === 'radio' && group.items?.length > 0) {
                        // Select the first item by default if radio is required
                        initialSelections[group.id] = [group.items[0].id];
                    } else {
                        initialSelections[group.id] = [];
                    }
                });
                setSelectedOptions(initialSelections);

                // Fetch Store Status
                try {
                    const storeRes = await fetch('/api/store/status');
                    if (storeRes.ok) {
                        const storeData = await storeRes.json();
                        setIsStoreOpen(storeData.isOpen);
                    }
                } catch (e) {
                    console.error("Failed to fetch store status", e);
                }

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
                return { ...prev, [group.id]: [itemId] }; // Only one choice
            } else {
                // checkbox
                if (checked) {
                    return { ...prev, [group.id]: [...currentSelected, itemId] };
                } else {
                    return { ...prev, [group.id]: currentSelected.filter((i) => i !== itemId) };
                }
            }
        });
    };

    // Validation Check: Are all required options selected?
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

    // Calculate Total Price
    const totalPrice = useMemo(() => {
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

    const handleAddToCart = () => {
        if (!menu || !isOrderable || !isStoreOpen) return;

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
            quantity: 1,
            selectedOptions: cartOptions,
            optionTotalPrice,
            subtotal: menu.price + optionTotalPrice
        });

        alert("장바구니에 담겼습니다.");
        router.push('/cart');
    };

    if (isLoading) {
        return (
            <div className={styles.wrapper} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={40} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (error || !menu) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container} style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <UtensilsCrossed size={48} color="var(--text-secondary)" />
                    <h2 style={{ marginTop: '1rem' }}>오류 발생</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{error || '메뉴를 찾을 수 없습니다.'}</p>
                    <button className={styles.backButton} style={{ marginTop: '2rem' }} onClick={() => router.back()}>
                        <ChevronLeft /> 뒤로 가기
                    </button>
                </div>
            </div>
        );
    }

    const imageSrc = menu.images && menu.images.length > 0 ? menu.images[0].srcUrl : null;

    return (
        <div className={styles.wrapper}>
            {/* Top Navigation */}
            <nav className={styles.nav}>
                <div className={styles.navContainer}>
                    <Link href="/" className={styles.logo}>
                        <Coffee size={24} />
                        <span>NCafe</span>
                    </Link>
                    <div className={styles.navLinks}>
                        <Link href="/menus" className={styles.activeLink}>Menu</Link>
                        <Link href="/order/my">My Order</Link>
                        <Link href="/about">About</Link>
                        <Link href="/locations">Locations</Link>
                    </div>
                    <div className={styles.navRight}>
                        <Link href="/cart" className={styles.cartLink}>
                            <ShoppingBag size={24} />
                            {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className={styles.container}>
                <button className={styles.backButton} onClick={() => router.push('/menus')}>
                    <ChevronLeft size={20} />
                    메뉴 목록으로 돌아가기
                </button>

                <div className={styles.mainContent}>
                    {/* Image Section */}
                    <div className={styles.imageSection}>
                        {imageSrc ? (
                            <Image
                                src={`/images/${imageSrc}`}
                                alt={menu.korName}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, 800px"
                                priority
                            />
                        ) : (
                            <div className={styles.placeholder}>
                                <UtensilsCrossed size={64} strokeWidth={1} />
                            </div>
                        )}
                    </div>

                    {/* Information Section */}
                    <div className={styles.infoSection}>
                        <div className={styles.names}>
                            <h2>{menu.engName}</h2>
                            <h1>{menu.korName}</h1>
                        </div>
                        <p className={styles.description}>{menu.description}</p>
                    </div>

                    {/* Options Section */}
                    {optionsData && optionsData.optionGroups && optionsData.optionGroups.length > 0 && (
                        <div className={styles.optionsSection}>
                            {optionsData.optionGroups.map((group) => (
                                <div key={group.id} className={styles.optionGroup}>
                                    <div className={styles.optionGroupHeader}>
                                        <h3 className={styles.optionGroupName}>{group.name}</h3>
                                        {group.isRequired && <span className={styles.requiredBadge}>필수</span>}
                                    </div>
                                    <div className={styles.optionItems}>
                                        {group.items?.map((item) => {
                                            const isSelected = (selectedOptions[group.id] || []).includes(item.id);
                                            return (
                                                <label
                                                    key={item.id}
                                                    className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
                                                >
                                                    <div className={styles.optionItemContent}>
                                                        <input
                                                            type={group.type === 'radio' ? 'radio' : 'checkbox'}
                                                            name={`option-group-${group.id}`}
                                                            checked={isSelected}
                                                            onChange={(e) => handleOptionChange(group, item.id, e.target.checked)}
                                                        />
                                                        <span className={styles.optionItemName}>{item.name}</span>
                                                    </div>
                                                    {item.priceDelta > 0 && (
                                                        <span className={styles.optionItemPrice}>
                                                            +{new Intl.NumberFormat('ko-KR').format(item.priceDelta)}원
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Sticky Action Bar */}
            <div className={styles.bottomBar}>
                <div className={styles.bottomBarContainer}>
                    <div className={styles.totalPriceInfo}>
                        <span className={styles.totalPriceLabel}>주문 금액</span>
                        <span className={styles.totalPriceValue}>
                            {new Intl.NumberFormat('ko-KR').format(totalPrice)}원
                        </span>
                    </div>

                    <div className={styles.actionArea}>
                        {!isStoreOpen && !isLoading && (
                            <div className={styles.storeClosedMessage}>
                                현재 매장 영업 종료로 주문이 불가합니다.
                            </div>
                        )}

                        <button
                            className={styles.orderButton}
                            disabled={!isOrderable || menu.isSoldOut || !isStoreOpen}
                            onClick={handleAddToCart}
                        >
                            {!isStoreOpen ? '영업 종료' : (menu.isSoldOut ? '품절' : (!isOrderable ? '옵션을 선택해주세요' : '장바구니 담기'))}
                        </button>
                    </div>
                </div>
            </div>

            <footer className={styles.footer}>
                <p>&copy; 2024 NCafe. All rights reserved.</p>
            </footer>
        </div>
    );
}
