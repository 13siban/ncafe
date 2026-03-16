'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../mypage.module.css';

interface OrderHistoryProps {
    orders: any[];
    topMenus: any[];
    favoritesNode?: React.ReactNode;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, topMenus, favoritesNode }) => {
    const router = useRouter();

    return (
        <>
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>주문 내역</h2>
                <div className={styles.orderList}>
                    {orders.length === 0 ? (
                        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                            주문 내역이 없습니다.
                        </p>
                    ) : (
                        orders.map(order => (
                            <div
                                key={order.id}
                                className={styles.orderCard}
                                onClick={() => router.push(`/order/${order.orderDate}/${order.orderNumber}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.dateInfo}>
                                        <div className={styles.date}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className={styles.displayNumber}>{order.displayNumber}</div>
                                    </div>
                                    <div className={styles.statusBadge}>
                                        {order.status}
                                    </div>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.summary}>{order.summary}</div>
                                    <div className={styles.totalPrice}>{new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {favoritesNode}

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>자주 주문한 메뉴 Top 5</h2>
                    <div className={styles.topMenuList}>
                        {topMenus.length === 0 ? (
                            <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                                주문 기록이 없습니다.
                            </p>
                        ) : (
                            topMenus.map((topMenu, idx) => (
                                <div
                                    key={topMenu.menuId}
                                    className={styles.topMenuCard}
                                    onClick={() => router.push(`/menus/${topMenu.engName ? topMenu.engName.toLowerCase().replace(/\s+/g, '-') : topMenu.menuId}`)}
                                >
                                    <div className={styles.topMenuRank}>{idx + 1}</div>
                                    <img
                                        src={`/images/${topMenu.imageUrl || 'placeholder.jpg'}`}
                                        alt={topMenu.menuName}
                                        className={styles.topMenuImg}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                        }}
                                    />
                                    <div className={styles.topMenuInfo}>
                                        <div className={styles.topMenuName}>{topMenu.menuName}</div>
                                        <div className={styles.topMenuCount}>주문 횟수: {topMenu.totalQuantity}회</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

export default OrderHistory;
