'use client';

import React from 'react';
import Link from 'next/link';
import styles from '../../page.module.css';
import { DashboardPopularMenu } from '../../types';

interface PopularMenusListProps {
    menus: DashboardPopularMenu[];
}

export function PopularMenusList({ menus }: PopularMenusListProps) {
    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>인기 메뉴 TOP 5</h2>
                <Link href="/admin/sales" className={styles.seeMore}>상세보기</Link>
            </div>
            <div className={styles.popularList}>
                {menus.length > 0 ? (
                    menus.map((menu) => (
                        <div key={menu.rank} className={styles.popularItem}>
                            <div className={styles.rank}>{menu.rank}</div>
                            <div className={styles.popularMenuInfo}>
                                <div className={styles.popularMenuName}>{menu.menuName}</div>
                                <div className={styles.popularMenuMeta}>{menu.categoryName}</div>
                            </div>
                            <div className={styles.popularSales}>
                                <div className={styles.soldCount}>{menu.quantitySold}잔</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>데이터가 없습니다.</div>
                )}
            </div>
        </section>
    );
}
