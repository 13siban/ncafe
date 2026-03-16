'use client';

import React from 'react';
import styles from '../../mypage.module.css';

interface PointSectionProps {
    pointData: { balance: number; history: any[] };
    gradeInfo: any;
}

const PointSection: React.FC<PointSectionProps> = ({ pointData, gradeInfo }) => {
    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>내 포인트</h2>

            <div className={styles.gradeCard} style={{ background: gradeInfo?.mainColor ? `linear-gradient(135deg, ${gradeInfo.mainColor}, ${gradeInfo.mainColor}dd)` : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))', color: gradeInfo?.textColor || 'white', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>사용 가능 포인트</span>
                    <span style={{ fontSize: '2rem', fontWeight: 700 }}>{new Intl.NumberFormat('ko-KR').format(pointData.balance)} <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>P</span></span>
                    {gradeInfo && (
                        <span style={{ fontSize: '0.85rem', marginTop: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px' }}>
                            결제 시 {gradeInfo.earnRate}% 적립
                        </span>
                    )}
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-gray-800)' }}>포인트 이용 내역</h3>
            <div className={styles.orderList}>
                {pointData.history.length === 0 ? (
                    <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                        이용 내역이 없습니다.
                    </p>
                ) : (
                    pointData.history.map((h, i) => (
                        <div key={i} className={styles.orderCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: '4px' }}>
                                    {new Date(h.createdAt).toLocaleDateString()}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-gray-800)', fontWeight: 500 }}>
                                    {h.description}
                                    {h.orderId && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>(주문 번호: {h.orderId})</span>}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: h.type === 'EARN' || h.type === 'CANCEL' ? 'var(--color-primary-600)' : 'var(--color-danger)' }}>
                                    {h.type === 'EARN' || h.type === 'CANCEL' ? '+' : '-'}{new Intl.NumberFormat('ko-KR').format(h.pointAmount)}P
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                                    잔액 {new Intl.NumberFormat('ko-KR').format(h.balanceSnapshot)}P
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default PointSection;
