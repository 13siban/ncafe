'use client';

import React from 'react';
import { Clock, Save } from 'lucide-react';
import styles from '../../page.module.css';

interface StoreSettingsProps {
    openTime: string;
    closeTime: string;
    isUpdating: boolean;
    onOpenTimeChange: (time: string) => void;
    onCloseTimeChange: (time: string) => void;
    onSave: () => void;
}

export function StoreSettings({
    openTime,
    closeTime,
    isUpdating,
    onOpenTimeChange,
    onCloseTimeChange,
    onSave
}: StoreSettingsProps) {
    return (
        <section className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
            <h2 className={styles.sectionTitle}>영업 시간 설정</h2>
            <div className={styles.storeManager}>
                <div className={styles.timeInputs}>
                    <div className={styles.timeInputGroup}>
                        <label>오픈 시간</label>
                        <div className={styles.inputWithIcon}>
                            <Clock size={16} />
                            <input
                                type="time"
                                value={openTime}
                                onChange={(e) => onOpenTimeChange(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.timeInputGroup}>
                        <label>마감 시간</label>
                        <div className={styles.inputWithIcon}>
                            <Clock size={16} />
                            <input
                                type="time"
                                value={closeTime}
                                onChange={(e) => onCloseTimeChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    className={styles.saveButton}
                    onClick={onSave}
                    disabled={isUpdating}
                >
                    <Save size={18} />
                    {isUpdating ? '저장 중...' : '설정 저장'}
                </button>
            </div>
        </section>
    );
}
