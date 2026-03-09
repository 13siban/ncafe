'use client';

import React from 'react';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import styles from '../../page.module.css';
import { CartItem as CartItemType } from '@/store/useCartStore';

interface CartItemProps {
    item: CartItemType;
    onRemove: (id: string) => void;
    onUpdateQuantity: (id: string, q: number) => void;
}

export function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
    return (
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
                        onClick={() => onRemove(item.cartId)}
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
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            <Minus size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
