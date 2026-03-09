'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from '../../page.module.css';
import { SalesPeriod } from '../../types';

interface SalesPeriodControlProps {
    period: SalesPeriod;
    currentDate: Date;
    onPeriodChange: (period: SalesPeriod) => void;
    onPrev: () => void;
    onNext: () => void;
}

export function SalesPeriodControl({
    period,
    currentDate,
    onPeriodChange,
    onPrev,
    onNext
}: SalesPeriodControlProps) {
    const getPeriodLabel = () => {
        if (period === 'daily') return format(currentDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko });
        if (period === 'weekly') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, 'MM.dd')} ~ ${format(end, 'MM.dd')}`;
        }
        return format(currentDate, 'yyyy년 MM월');
    };

    const isNextDisabled = isSameDay(currentDate, new Date()) && period === 'daily';

    return (
        <div className={styles.controls}>
            <div className={styles.periodTabs}>
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                    <button
                        key={p}
                        className={`${styles.tabBtn} ${period === p ? styles.activeTabBtn : ''}`}
                        onClick={() => onPeriodChange(p)}
                    >
                        {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
                    </button>
                ))}
            </div>

            <div className={styles.dateNav}>
                <button onClick={onPrev} className={styles.navBtn}><ChevronLeft size={20} /></button>
                <div className={styles.currentDate}>
                    <CalendarIcon size={16} />
                    <span>{getPeriodLabel()}</span>
                </div>
                <button
                    onClick={onNext}
                    className={styles.navBtn}
                    disabled={isNextDisabled}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
