'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ClipboardList, ShoppingBag, BarChart3 } from 'lucide-react';
import styles from '../../page.module.css';

const quickActionsData = [
    { href: '/admin/menus/new', icon: <Plus size={24} />, label: '메뉴 등록' },
    { href: '/admin/menus', icon: <ClipboardList size={24} />, label: '메뉴 관리' },
    { href: '/admin/orders', icon: <ShoppingBag size={24} />, label: '주문 관리' },
    { href: '/admin/sales', icon: <BarChart3 size={24} />, label: '매출 분석' },
];

export function QuickActions() {
    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>빠른 작업</h2>
            <div className={styles.quickActions}>
                {quickActionsData.map((action, index) => (
                    <Link key={index} href={action.href} className={styles.actionCard}>
                        <div className={styles.actionIcon}>{action.icon}</div>
                        <span className={action.label}>{action.label}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
