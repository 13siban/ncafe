'use client';

import React from 'react';
import styles from '../../page.module.css';

interface PointUsageSectionProps {
    pointBalance: number;
    usePoints: number | string;
    setUsePoints: (v: number | string) => void;
    originalTotalPrice: number;
    estimatedEarnPoints: number;
}

const PointUsageSection: React.FC<PointUsageSectionProps> = ({
    pointBalance, usePoints, setUsePoints, originalTotalPrice, estimatedEarnPoints
}) => {
    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>💰</span> 포인트 사용
            </h2>
            <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>
                        사용 가능 포인트: <strong>{new Intl.NumberFormat('ko-KR').format(pointBalance)}P</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginLeft: '6px' }}>(100원 단위 사용)</span>
                    </span>
                    {estimatedEarnPoints > 0 && (
                        <span style={{ color: 'var(--color-primary-600)' }}>예상 적립: {new Intl.NumberFormat('ko-KR').format(estimatedEarnPoints)}P</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="number"
                            step="100"
                            min="0"
                            max={Math.floor(Math.min(pointBalance, originalTotalPrice) / 100) * 100}
                            className={styles.input}
                            style={{ width: '100%', textAlign: 'right', fontSize: '1.1rem', padding: '12px 50px 12px 16px', fontWeight: '600' }}
                            value={usePoints}
                            onChange={(e) => {
                                let v = e.target.value;
                                setUsePoints(v === "" ? "" : parseInt(v, 10));
                            }}
                            placeholder="사용할 포인트 입력"
                        />
                        <span style={{ position: 'absolute', right: '32px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-500)', fontWeight: '600', pointerEvents: 'none' }}>P</span>
                    </div>
                    <button
                        type="button"
                        style={{
                            width: 'auto',
                            whiteSpace: 'nowrap',
                            padding: '0 20px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: 'pointer'
                        }}
                        onClick={() => setUsePoints(Math.floor(Math.min(pointBalance, originalTotalPrice) / 100) * 100)}
                    >
                        전액 사용
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PointUsageSection;
