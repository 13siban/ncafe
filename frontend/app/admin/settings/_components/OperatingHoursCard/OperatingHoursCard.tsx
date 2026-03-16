'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import styles from '../../page.module.css';

interface OperatingHoursCardProps {
    openTime: string;
    closeTime: string;
    setOpenTime: (v: string) => void;
    setCloseTime: (v: string) => void;
}

const OperatingHoursCard: React.FC<OperatingHoursCardProps> = ({
    openTime, closeTime, setOpenTime, setCloseTime
}) => {
    return (
        <section className={styles.card}>
            <div className={styles.cardHeader}>
                <Clock className={styles.cardIcon} size={20} />
                <h2 className={styles.cardTitle}>영업 시간 설정</h2>
            </div>
            <div className={styles.cardContent}>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>오픈 시간</label>
                        <div className={styles.inputWrapper}>
                            <Clock className={styles.inputIcon} size={16} />
                            <input
                                type="time"
                                className={styles.input}
                                value={openTime}
                                onChange={(e) => setOpenTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>마감 시간</label>
                        <div className={styles.inputWrapper}>
                            <Clock className={styles.inputIcon} size={16} />
                            <input
                                type="time"
                                className={styles.input}
                                value={closeTime}
                                onChange={(e) => setCloseTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OperatingHoursCard;
