'use client';

import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import styles from '../../../OptionGroupManager.module.css';
import { OptionGroup, OptionItem } from '../../types';

interface OptionGroupCardProps {
    group: OptionGroup;
    catId: number | null;
    openGroupModal: (group: OptionGroup, catId: number | null) => void;
    unlinkGroup: (catId: number, groupId: number, groupName: string) => void;
    deleteGroup: (id: number) => void;
    openItemModal: (groupId: number, item?: OptionItem) => void;
    deleteItem: (groupId: number, itemId: number) => void;
}

export function OptionGroupCard({
    group,
    catId,
    openGroupModal,
    unlinkGroup,
    deleteGroup,
    openItemModal,
    deleteItem
}: OptionGroupCardProps) {
    return (
        <div key={`${catId}-${group.id}`} className={styles.groupCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h3 className={styles.groupName}>{group.name}</h3>
                    <div className={styles.badges}>
                        <span className={`${styles.badge} ${group.type === 'radio' ? styles.badgeRadio : styles.badgeCheckbox}`}>
                            {group.type === 'radio' ? '단일선택' : '다중선택'}
                        </span>
                        {group.isRequired && (
                            <span className={`${styles.badge} ${styles.badgeRequired}`}>필수</span>
                        )}
                    </div>
                </div>
                <div className={styles.cardActions}>
                    <button className={styles.iconButton} onClick={() => openGroupModal(group, catId)} title="옵션 수정">
                        <Edit2 size={16} />
                    </button>
                    {catId !== null ? (
                        <button className={`${styles.iconButton} ${styles.deleteIcon}`} onClick={() => unlinkGroup(catId, group.id, group.name)} title={`카테고리에서 [${group.name}] 해제`}>
                            <Trash2 size={16} />
                        </button>
                    ) : (
                        <button className={`${styles.iconButton} ${styles.deleteIcon}`} onClick={() => deleteGroup(group.id)} title="옵션 완전 삭제">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                    <h4>항목 ({group.items?.length || 0})</h4>
                    <button className={styles.actionButton} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openItemModal(group.id)}>
                        <Plus size={12} /> 추가
                    </button>
                </div>
                {group.items && group.items.length > 0 ? (
                    <ul className={styles.itemList}>
                        {[...group.items].sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
                            <li key={item.id} className={styles.item}>
                                <div>
                                    <span className={styles.itemName}>{item.name} </span>
                                    {item.priceDelta > 0 && <span className={styles.itemPrice}>(+{item.priceDelta}원)</span>}
                                </div>
                                <div className={styles.itemControls}>
                                    <button className={styles.iconButton} onClick={() => openItemModal(group.id, item)} style={{ padding: '0.2rem' }}>
                                        <Edit2 size={12} />
                                    </button>
                                    <button className={`${styles.iconButton} ${styles.deleteIcon}`} onClick={() => deleteItem(group.id, item.id)} style={{ padding: '0.2rem' }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>항목이 없습니다.</p>
                )}
            </div>
        </div>
    );
}
