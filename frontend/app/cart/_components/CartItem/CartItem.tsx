'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import styles from '../../page.module.css';
import { CartItem as CartItemType, useCartStore, CartOption } from '@/store/useCartStore';
import { MenuOptionsResponse, OptionGroup } from '@/types/menuOption';

interface CartItemProps {
    item: CartItemType;
    onRemove: (id: string) => void;
    onUpdateQuantity: (id: string, q: number) => void;
    onValidityChange?: (id: string, isValid: boolean) => void;
}

export function CartItem({ item, onRemove, onUpdateQuantity, onValidityChange }: CartItemProps) {
    const updateOptions = useCartStore((state) => state.updateOptions);
    const [optionsData, setOptionsData] = useState<MenuOptionsResponse | null>(null);
    const [showAdditional, setShowAdditional] = useState(false);

    // Initial selected options mapped by groupId
    const initialSelectedIds = useMemo(() => {
        const mapping: Record<number, number[]> = {};
        item.selectedOptions.forEach(opt => {
            if (!mapping[opt.optionGroupId]) {
                mapping[opt.optionGroupId] = [];
            }
            mapping[opt.optionGroupId].push(opt.optionItemId);
        });
        return mapping;
    }, [item.selectedOptions]);

    const [selectedIds, setSelectedIds] = useState<Record<number, number[]>>(initialSelectedIds);

    // Update internal state when item.selectedOptions changes (e.g. from store updates)
    useEffect(() => {
        setSelectedIds(initialSelectedIds);
    }, [initialSelectedIds]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch(`/api/menus/${item.menuId}/options`);
                if (res.ok) {
                    const data: MenuOptionsResponse = await res.json();
                    setOptionsData(data);
                }
            } catch (error) {
                console.error('Failed to fetch options:', error);
            }
        };
        fetchOptions();
    }, [item.menuId]);
    
    // Check if mandatory options are selected
    const isItemValid = useMemo(() => {
        if (!optionsData) return true; // Assume valid while loading to avoid flickering
        return optionsData.optionGroups.every(group => {
            if (!group.isRequired) return true;
            const selections = selectedIds[group.id] || [];
            return selections.length > 0;
        });
    }, [optionsData, selectedIds]);

    useEffect(() => {
        if (onValidityChange) {
            onValidityChange(item.stableId || item.cartId, isItemValid);
        }
    }, [isItemValid, item.stableId, onValidityChange]);

    const handleOptionToggle = (group: OptionGroup, itemId: number, checked: boolean) => {
        const currentGroupIds = selectedIds[group.id] || [];
        let newIds: number[];

        if (group.type === 'radio') {
            newIds = [itemId];
        } else {
            if (checked) {
                newIds = [...currentGroupIds, itemId];
            } else {
                newIds = currentGroupIds.filter(id => id !== itemId);
            }
        }

        const newSelectedIds = { ...selectedIds, [group.id]: newIds };
        setSelectedIds(newSelectedIds);

        // Map back to CartOption[] and update store
        const newCartOptions: CartOption[] = [];
        optionsData?.optionGroups.forEach(g => {
            const ids = newSelectedIds[g.id] || [];
            g.items.forEach(i => {
                if (ids.includes(i.id)) {
                    newCartOptions.push({
                        optionGroupId: g.id,
                        optionGroupName: g.name,
                        optionItemId: i.id,
                        optionItemName: i.name,
                        priceDelta: i.priceDelta
                    });
                }
            });
        });

        updateOptions(item.cartId, newCartOptions);
    };

    const essentialGroups = optionsData?.optionGroups.filter(g => g.isRequired) || [];
    const additionalGroups = optionsData?.optionGroups.filter(g => !g.isRequired) || [];

    return (
        <div className={styles.cartItem}>
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
                    {!isItemValid && (
                        <span className={styles.invalidBadge}>필수 옵션 선택 필요</span>
                    )}
                    <button
                        className={styles.deleteButton}
                        onClick={() => onRemove(item.cartId)}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                <div className={styles.optionList}>
                    {/* 필수 옵션 영역 */}
                    {essentialGroups.map(group => (
                        <div key={group.id} className={styles.optionGroup}>
                            <div className={styles.optionGroupHeader}>
                                <span className={styles.optionGroupName}>{group.name}</span>
                                <span className={styles.requiredBadge}>[필수]</span>
                            </div>
                            <div className={styles.optionItems}>
                                {group.items.map(opt => {
                                    const isSelected = (selectedIds[group.id] || []).includes(opt.id);
                                    return (
                                        <label
                                            key={opt.id}
                                            className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
                                        >
                                            <input
                                                type={group.type === 'radio' ? 'radio' : 'checkbox'}
                                                checked={isSelected}
                                                onChange={(e) => handleOptionToggle(group, opt.id, e.target.checked)}
                                            />
                                            {opt.name}
                                            {opt.priceDelta > 0 && ` (+${opt.priceDelta}원)`}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* 추가 옵션 토글 버튼 */}
                    {additionalGroups.length > 0 && (
                        <button
                            className={styles.toggleAdditionalButton}
                            onClick={() => setShowAdditional(!showAdditional)}
                        >
                            {showAdditional ? (
                                <><ChevronUp size={14} /> 옵션 닫기</>
                            ) : (
                                <><ChevronDown size={14} /> 옵션 추가</>
                            )}
                        </button>
                    )}

                    {/* 추가 옵션 영역 */}
                    {showAdditional && additionalGroups.map(group => (
                        <div key={group.id} className={styles.optionGroup}>
                            <div className={styles.optionGroupHeader}>
                                <span className={styles.optionGroupName}>{group.name}</span>
                            </div>
                            <div className={styles.optionItems}>
                                {group.items.map(opt => {
                                    const isSelected = (selectedIds[group.id] || []).includes(opt.id);
                                    return (
                                        <label
                                            key={opt.id}
                                            className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
                                        >
                                            <input
                                                type={group.type === 'radio' ? 'radio' : 'checkbox'}
                                                checked={isSelected}
                                                onChange={(e) => handleOptionToggle(group, opt.id, e.target.checked)}
                                            />
                                            {opt.name}
                                            {opt.priceDelta > 0 && ` (+${opt.priceDelta}원)`}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {!optionsData && item.selectedOptions.length > 0 && (
                        <ul className={styles.optionList} style={{ margin: 0 }}>
                            {item.selectedOptions.map((opt, idx) => (
                                <li key={idx}>
                                    {opt.optionGroupName}: {opt.optionItemName}
                                    {opt.priceDelta > 0 && ` (+${opt.priceDelta}원)`}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

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
