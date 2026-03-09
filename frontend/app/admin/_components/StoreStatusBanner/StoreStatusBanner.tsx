'use client';

import React from 'react';
import { DoorOpen, DoorClosed } from 'lucide-react';
import styles from '../../page.module.css';
import { StoreStatus } from '../../types';

interface StoreStatusBannerProps {
    status: StoreStatus | null;
    onToggle: () => void;
}

export function StoreStatusBanner({ status, onToggle }: StoreStatusBannerProps) {
    return (
        <div className={`${styles.statusBanner} ${status?.isOpen ? styles.bannerOpen : styles.bannerClosed}`}>
            <div className={styles.bannerInfo}>
                <div className={styles.bannerIcon}>
                    {status?.isOpen ? <DoorOpen size={24} /> : <DoorClosed size={24} />}
                </div>
                <div className={styles.bannerText}>
                    <h3>매장이 현재 {status?.isOpen ? '영업 중' : '영업 종료'} 상태입니다.</h3>
                    <p>{status?.isOpen ? `${status.openTime}에 영업 개시됨` : '현재 주문이 중단되었습니다.'}</p>
                </div>
            </div>
            <button
                className={`${styles.toggleButton} ${status?.isOpen ? styles.activeToggle : ''}`}
                onClick={onToggle}
            >
                <div className={styles.toggleCircle} />
                <span className={styles.toggleText}>{status?.isOpen ? 'ON' : 'OFF'}</span>
            </button>
        </div>
    );
}
