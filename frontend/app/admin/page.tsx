'use client';

import React from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  ShoppingBag,
  TrendingUp,
  Users,
  Plus,
  ClipboardList,
  Settings,
  BarChart3,
  Clock,
  DoorOpen,
  DoorClosed,
  Save
} from 'lucide-react';
import styles from './page.module.css';
import { adminStoreAPI } from '@/app/lib/api';

interface StoreStatus {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const stats = [
  {
    title: '총 메뉴',
    value: '12',
    change: '+2',
    changeLabel: '이번 달',
    icon: <UtensilsCrossed size={20} />,
    iconClass: 'statIconPrimary',
  },
  {
    title: '오늘 주문',
    value: '48',
    change: '+12%',
    changeLabel: '어제 대비',
    icon: <ShoppingBag size={20} />,
    iconClass: 'statIconSuccess',
  },
  {
    title: '오늘 매출',
    value: '₩285,000',
    change: '+8%',
    changeLabel: '어제 대비',
    icon: <TrendingUp size={20} />,
    iconClass: 'statIconInfo',
  },
  {
    title: '방문 고객',
    value: '32',
    change: '-5%',
    changeLabel: '어제 대비',
    icon: <Users size={20} />,
    iconClass: 'statIconWarning',
    isNegative: true,
  },
];

const quickActions = [
  { href: '/admin/menus/new', icon: <Plus size={24} />, label: '메뉴 등록' },
  { href: '/admin/menus', icon: <ClipboardList size={24} />, label: '메뉴 관리' },
  { href: '/admin/orders', icon: <ShoppingBag size={24} />, label: '주문 관리' },
  { href: '/admin/settings', icon: <Settings size={24} />, label: '설정' },
];

export default function AdminDashboardPage() {
  const [storeStatus, setStoreStatus] = React.useState<StoreStatus | null>(null);
  const [openTime, setOpenTime] = React.useState('');
  const [closeTime, setCloseTime] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    fetchStoreStatus();
  }, []);

  const fetchStoreStatus = async () => {
    try {
      const data = await adminStoreAPI.getStoreStatus();
      setStoreStatus(data);
      setOpenTime(data.openTime || '09:00');
      setCloseTime(data.closeTime || '22:00');
    } catch (error) {
      console.error('Failed to fetch store status:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!storeStatus) return;
    try {
      if (storeStatus.isOpen) {
        await adminStoreAPI.closeStore();
      } else {
        await adminStoreAPI.openStore();
      }
      fetchStoreStatus();
    } catch (error) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    try {
      await adminStoreAPI.updateSettings(openTime, closeTime);
      alert('영업 시간이 수정되었습니다.');
      fetchStoreStatus();
    } catch (error) {
      alert('수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>대시보드</h1>
          <p className={styles.subtitle}>오늘도 좋은 하루 되세요, 김사장님! ☕</p>
        </div>

        {storeStatus && (
          <div className={`${styles.statusBadge} ${storeStatus.isOpen ? styles.statusOpen : styles.statusClosed}`}>
            {storeStatus.isOpen ? <DoorOpen size={16} /> : <DoorClosed size={16} />}
            <span>{storeStatus.isOpen ? '영업 중' : '영업 종료'}</span>
          </div>
        )}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          {/* Stats */}
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>{stat.title}</span>
                  <div className={`${styles.statIcon} ${styles[stat.iconClass]}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={`${styles.statChange} ${stat.isNegative ? styles.statChangeNegative : ''}`}>
                  <span>{stat.change}</span>
                  <span style={{ color: 'var(--color-gray-400)' }}>{stat.changeLabel}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>빠른 작업</h2>
            <div className={styles.quickActions}>
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href} className={styles.actionCard}>
                  <div className={styles.actionIcon}>{action.icon}</div>
                  <span className={styles.actionLabel}>{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.rightColumn}>
          {/* Store Management Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>매장 관리</h2>
            </div>

            <div className={styles.storeManager}>
              <div className={styles.manageItem}>
                <div className={styles.manageInfo}>
                  <span className={styles.manageLabel}>현재 영업 상태</span>
                  <span className={styles.manageDesc}>고객의 주문 가능 여부를 결정합니다.</span>
                </div>
                <button
                  className={`${styles.toggleButton} ${storeStatus?.isOpen ? styles.activeToggle : ''}`}
                  onClick={handleToggleStatus}
                >
                  <div className={styles.toggleCircle} />
                  <span className={styles.toggleText}>{storeStatus?.isOpen ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              <div className={styles.divider} />

              <div className={styles.manageItem}>
                <div className={styles.manageInfo}>
                  <span className={styles.manageLabel}>영업 시간 설정</span>
                  <span className={styles.manageDesc}>매장 상세 정보에 표시될 시간입니다.</span>
                </div>
              </div>

              <div className={styles.timeInputs}>
                <div className={styles.timeInputGroup}>
                  <label>오픈 시간</label>
                  <div className={styles.inputWithIcon}>
                    <Clock size={16} />
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.timeInputGroup}>
                  <label>마감 시간</label>
                  <div className={styles.inputWithIcon}>
                    <Clock size={16} />
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                className={styles.saveButton}
                onClick={handleUpdateSettings}
                disabled={isUpdating}
              >
                <Save size={18} />
                {isUpdating ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
