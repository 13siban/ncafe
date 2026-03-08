"use client";

import styles from './page.module.css';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { authAPI } from '@/app/lib/api';

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
                <div style={{ width: 24 }}></div> {/* Spacer for center alignment */}
            </header>

            <main className={styles.container}>
                {items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <ShoppingBag size={64} color="var(--color-gray-300)" />
                        <p>장바구니가 비어있습니다.</p>
                        <button className={styles.primaryButton} onClick={() => router.push('/menus')}>
                            메뉴 보러가기
                        </button>
                    </div>
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
                                <div key={item.cartId} className={styles.cartItem}>
                                    <div className={styles.itemImage}>
                                        {item.imageSrc ? (
                                            <Image
                                                src={`/images/${item.imageSrc}`}
                                                alt={item.menuName}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className={styles.imagePlaceholder}>
                                                <ShoppingBag size={24} color="#ccc" />
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemHeader}>
                                            <h3 className={styles.itemName}>{item.menuName}</h3>
                                            <button
                                                className={styles.deleteButton}
                                                onClick={() => removeItem(item.cartId)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <ul className={styles.optionList}>
                                            {item.selectedOptions.length === 0 && <li>옵션 없음</li>}
                                            {item.selectedOptions.map((opt, idx) => (
                                                <li key={idx}>
                                                    {opt.optionGroupName}: {opt.optionItemName}
                                                    {opt.priceDelta > 0 && ` (+${opt.priceDelta}원)`}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className={styles.itemFooter}>
                                            <div className={styles.price}>
                                                {new Intl.NumberFormat('ko-KR').format(item.subtotal)}원
                                            </div>
                                            <div className={styles.quantityControl}>
                                                <button
                                                    onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.summarySection}>
                            <div className={styles.summaryRow}>
                                <span>총 주문 금액</span>
                                <span className={styles.totalPrice}>
                                    {new Intl.NumberFormat('ko-KR').format(getTotalPrice())}원
                                </span>
                            </div>
                            <button
                                className={styles.orderButton}
                                onClick={handleOrder}
                                disabled={isOrdering}
                            >
                                {isOrdering ? '주문 처리 중...' : `${new Intl.NumberFormat('ko-KR').format(getTotalPrice())}원 주문하기`}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
