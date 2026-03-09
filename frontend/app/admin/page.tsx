'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

import { useDashboard } from './_components/useDashboard';
import { StoreStatusBanner } from './_components/StoreStatusBanner/StoreStatusBanner';
import { DashboardStatsGrid } from './_components/DashboardStatsGrid/DashboardStatsGrid';
import { RecentOrdersList } from './_components/RecentOrdersList/RecentOrdersList';
import { PopularMenusList } from './_components/PopularMenusList/PopularMenusList';
import { QuickActions } from './_components/QuickActions/QuickActions';
import { StoreSettings } from './_components/StoreSettings/StoreSettings';

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('daily');
  const {
    storeStatus,
    openTime,
    closeTime,
    isUpdating,
    stats,
    recentOrders,
    popularMenus,
    isLoading,
    setOpenTime,
    setCloseTime,
    handleToggleStatus,
    handleUpdateSettings
  } = useDashboard(period);

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>대시보드</h1>
          <p className={styles.subtitle}>오늘도 좋은 하루 되세요! ☕ {isLoading ? '(업데이트 중...)' : ''}</p>
        </div>

        <div className={styles.periodTabs}>
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              className={`${styles.tabButton} ${period === p ? styles.activeTab : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>
      </div>

      <StoreStatusBanner status={storeStatus} onToggle={handleToggleStatus} />

      <DashboardStatsGrid stats={stats} period={period} />

      {/* Preparing Orders Notification */}
      {stats && stats.preparingOrders > 0 && (
        <div className={styles.notifBanner}>
          <AlertCircle size={20} className={styles.notifIcon} />
          <span>현재 제조 대기 중인 주문이 <strong>{stats.preparingOrders}건</strong> 있습니다.</span>
          <Link href="/admin/orders" className={styles.notifLink}>주문 관리 이동 <ChevronRight size={16} /></Link>
        </div>
      )}

      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <RecentOrdersList orders={recentOrders} />
          <QuickActions />
        </div>

        <div className={styles.rightColumn}>
          <PopularMenusList menus={popularMenus} />
          <StoreSettings
            openTime={openTime}
            closeTime={closeTime}
            isUpdating={isUpdating}
            onOpenTimeChange={setOpenTime}
            onCloseTimeChange={setCloseTime}
            onSave={handleUpdateSettings}
          />
        </div>
      </div>
    </div>
  );
}
