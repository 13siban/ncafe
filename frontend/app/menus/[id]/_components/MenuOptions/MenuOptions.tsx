'use client';

import React from 'react';
import styles from '../../page.module.css';
import { MenuOptionsResponse, OptionGroup } from '../../types';

interface MenuOptionsProps {
    optionsData: MenuOptionsResponse;
    selectedOptions: Record<number, number[]>;
    onOptionChange: (group: OptionGroup, itemId: number, checked: boolean) => void;
}

export function MenuOptions({ optionsData, selectedOptions, onOptionChange }: MenuOptionsProps) {
    if (!optionsData?.optionGroups || optionsData.optionGroups.length === 0) return null;

    return (
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
                                            onChange={(e) => onOptionChange(group, item.id, e.target.checked)}
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
    );
}
