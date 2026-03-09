'use client';

import React from 'react';
import styles from '../../page.module.css';
import { MenuRanking } from '../../types';

interface MenuRankingTableProps {
    ranking: MenuRanking[];
}

export function MenuRankingTable({ ranking }: MenuRankingTableProps) {
    return (
        <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>상품별 판매 현황</h3>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>메뉴명</th>
                            <th>카테고리</th>
                            <th>판매량</th>
                            <th>매출액</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranking.length > 0 ? ranking.map(menu => (
                            <tr key={menu.rank}>
                                <td className={styles.rankCell}>{menu.rank}</td>
                                <td className={styles.menuNameCell}>{menu.menuName}</td>
                                <td>{menu.categoryName}</td>
                                <td className={styles.countCell}>{menu.quantitySold}</td>
                                <td className={styles.priceCell}>₩{menu.totalSales.toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className={styles.empty}>데이터가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
