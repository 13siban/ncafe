'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import styles from '../../../OptionGroupManager.module.css';
import { OptionGroup } from '../../types';

interface LinkGroupModalProps {
    allOptions: OptionGroup[];
    categoryOptions: Record<number, OptionGroup[]>;
    targetCategoryId: number | null;
    onClose: () => void;
    onLink: (id: number, name: string) => void;
}

export function LinkGroupModal({
    allOptions,
    categoryOptions,
    targetCategoryId,
    onClose,
    onLink
}: LinkGroupModalProps) {
    const unselectedOptions = allOptions.filter(opt => {
        const existing = categoryOptions[targetCategoryId!] || [];
        return !existing.some(e => e.id === opt.id);
    });

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>기존 옵션 그룹 불러오기</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div>
                    <p className={styles.modalDesc}>다른 카테고리에서 이미 사용 중인 옵션을 이 카테고리에 복사해서 적용합니다. 항목과 가격은 공유됩니다.</p>

                    {allOptions.length === 0 ? (
                        <div className={styles.emptyState}>등록된 기존 옵션이 없습니다.</div>
                    ) : (
                        <div className={styles.linkList}>
                            {unselectedOptions.map(opt => (
                                <div key={opt.id} className={styles.linkListItem}>
                                    <div className={styles.linkItemContent}>
                                        <span className={styles.linkItemName}>{opt.name}</span>
                                        <span className={styles.linkItemMeta}>
                                            {opt.type === 'radio' ? '단일선택' : '다중선택'} · 항목 {opt.items?.length || 0}개
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.addBtnText}
                                        onClick={() => onLink(opt.id, opt.name)}
                                    >
                                        <Plus size={14} /> 추가
                                    </button>
                                </div>
                            ))}
                            {unselectedOptions.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    모든 옵션이 이미 연결되어 있습니다.
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>닫기</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
