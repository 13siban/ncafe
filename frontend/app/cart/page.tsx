"use client";

import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleOrder = () => {
        if (items.length === 0) return;
        router.push('/order/confirm');
    };

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
                                    key={item.cartId}
                                    item={item}
                                    onRemove={removeItem}
                                    onUpdateQuantity={updateQuantity}
                                />
                            ))}
                        </div>

                        <CartSummary
                            totalPrice={getTotalPrice()}
                            isOrdering={isOrdering}
                            onOrder={handleOrder}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
