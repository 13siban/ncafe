"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import styles from './page.module.css';
import { useCartStore } from '@/store/useCartStore';

import { CartItem } from './_components/CartItem/CartItem';
import { CartSummary } from './_components/CartSummary/CartSummary';
import { CartEmpty } from './_components/CartEmpty/CartEmpty';

export default function CartPage() {
    const router = useRouter();
    const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);
    const [isOrdering, setIsOrdering] = useState(false);
    const [invalidItems, setInvalidItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Cleanup invalidItems when items are removed from cart
    useEffect(() => {
        if (!isMounted) return;
        setInvalidItems(prev => {
            const next = new Set(prev);
            const currentIds = new Set(items.map(it => it.stableId || it.cartId));
            let changed = false;
            for (const id of Array.from(next)) {
                if (!currentIds.has(id)) {
                    next.delete(id);
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [items, isMounted]);

    const handleOrder = () => {
        if (items.length === 0 || invalidItems.size > 0) return;
        router.push('/order/confirm');
    };

    const handleValidityChange = useCallback((stableId: string, isValid: boolean) => {
        setInvalidItems(prev => {
            const currentlyInvalid = prev.has(stableId);
            if (isValid && !currentlyInvalid) return prev;
            if (!isValid && currentlyInvalid) return prev;

            const next = new Set(prev);
            if (isValid) next.delete(stableId);
            else next.add(stableId);
            return next;
        });
    }, []);

    if (!isMounted) return null;

    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className={styles.title}>장바구니</h1>
                <div style={{ width: 24 }}></div>
            </header>

            <main className={styles.container}>
                {items.length === 0 ? (
                    <CartEmpty />
                ) : (
                    <>
                        <div className={styles.cartHeader}>
                            <span>주문 메뉴 {items.reduce((sum, item) => sum + item.quantity, 0)}개</span>
                            <button className={styles.clearButton} onClick={clearCart}>
                                전체 삭제
                            </button>
                        </div>

                        <div className={styles.cartList}>
                            {items.map((item) => (
                                <CartItem
                                    key={item.stableId || item.cartId}
                                    item={item}
                                    onRemove={removeItem}
                                    onUpdateQuantity={updateQuantity}
                                    onValidityChange={handleValidityChange}
                                />
                            ))}
                        </div>

                        {invalidItems.size > 0 && (
                            <div className={styles.validationError}>
                                필수 옵션이 선택되지 않은 메뉴가 있습니다. 확인해 주세요.
                            </div>
                        )}

                        <CartSummary
                            totalPrice={getTotalPrice()}
                            isOrdering={isOrdering}
                            onOrder={handleOrder}
                            disabled={invalidItems.size > 0}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
