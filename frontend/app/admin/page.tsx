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
  Save,
  ChevronRight,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import styles from './page.module.css';
import { adminStoreAPI, adminDashboardAPI, adminSalesAPI } from '@/app/lib/api';

interface StoreStatus {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface DashboardStats {
  period: string;
  date: string;
  totalMenus: number;
  orderCount: number;
  orderCountChange: string;
  totalSales: number;
  totalSalesChange: string;
  customerCount: number;
  customerCountChange: string;
  preparingOrders: number;
  completedOrders: number;
  rejectedOrders: number;
}

interface RecentOrder {
  id: number;
  displayNumber: string;
  customerName: string;
  isGuest: boolean;
  status: string;
  totalPrice: number;
  summary: string;
  createdAt: string;
}

interface PopularMenu {
  rank: number;
  menuName: string;
  categoryName: string;
  quantitySold: number;
  totalSales: number;
}

const quickActions = [
  { href: '/admin/menus/new', icon: <Plus size={24} />, label: '메뉴 등록' },
  { href: '/admin/menus', icon: <ClipboardList size={24} />, label: '메뉴 관리' },
  { href: '/admin/orders', icon: <ShoppingBag size={24} />, label: '주문 관리' },
  { href: '/admin/sales', icon: <BarChart3 size={24} />, label: '매출 분석' },
];

export default function AdminDashboardPage() {
  const [storeStatus, setStoreStatus] = React.useState<StoreStatus | null>(null);
  const [openTime, setOpenTime] = React.useState('');
  const [closeTime, setCloseTime] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  const [period, setPeriod] = React.useState('daily');
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = React.useState<RecentOrder[]>([]);
  const [popularMenus, setPopularMenus] = React.useState<PopularMenu[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetchStoreStatus(),
      fetchStats(period),
      fetchRecentOrders(),
      fetchPopularMenus(period)
    ]).finally(() => setIsLoading(false));
  }, [period]);

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

  const fetchStats = async (p: string) => {
    try {
      const data = await adminDashboardAPI.getStats(p);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const data = await adminDashboardAPI.getRecentOrders();
      setRecentOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    }
  };

  const fetchPopularMenus = async (p: string) => {
    try {
      const data = await adminSalesAPI.getMenuRanking(p);
      setPopularMenus(data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch popular menus:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!storeStatus) return;
    const action = storeStatus.isOpen ? '영업을 종료하시겠습니까? 주문번호가 초기화됩니다.' : '영업을 개시하시겠습니까?';
    if (!confirm(action)) return;

    try {
      if (storeStatus.isOpen) {
        await adminStoreAPI.closeStore();
      } else {
        await adminStoreAPI.openStore();
      }
      fetchStoreStatus();
      // 주문 번호 초기화 등이 일어나므로 통계도 리프레시
      fetchStats(period);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PREPARING': return { label: '제조 중', color: styles.statusBadgePreparing };
      case 'COMPLETED': return { label: '완료', color: styles.statusBadgeCompleted };
      case 'REJECTED': return { label: '반려', color: styles.statusBadgeRejected };
      case 'PICKED_UP': return { label: '수령 완료', color: styles.statusBadgePickedUp };
      default: return { label: status, color: '' };
    }
  };

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

      {/* Store Status Banner */}
      <div className={`${styles.statusBanner} ${storeStatus?.isOpen ? styles.bannerOpen : styles.bannerClosed}`}>
        <div className={styles.bannerInfo}>
          <div className={styles.bannerIcon}>
            {storeStatus?.isOpen ? <DoorOpen size={24} /> : <DoorClosed size={24} />}
          </div>
          <div className={styles.bannerText}>
            <h3>매장이 현재 {storeStatus?.isOpen ? '영업 중' : '영업 종료'} 상태입니다.</h3>
            <p>{storeStatus?.isOpen ? `${storeStatus.openTime}에 영업 개시됨` : '현재 주문이 중단되었습니다.'}</p>
          </div>
        </div>
        <button
          className={`${styles.toggleButton} ${storeStatus?.isOpen ? styles.activeToggle : ''}`}
          onClick={handleToggleStatus}
        >
          <div className={styles.toggleCircle} />
          <span className={styles.toggleText}>{storeStatus?.isOpen ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="총 메뉴"
          value={stats?.totalMenus.toString() || '0'}
          change=""
          icon={<UtensilsCrossed size={20} />}
          iconClass="statIconPrimary"
        />
        <StatCard
          title={`${period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달'} 주문`}
          value={stats?.orderCount.toString() || '0'}
          change={stats?.orderCountChange || ''}
          changeLabel={`${period === 'daily' ? '어제' : period === 'weekly' ? '저번 주' : '저번 달'} 대비`}
          icon={<ShoppingBag size={20} />}
          iconClass="statIconSuccess"
        />
        <StatCard
          title={`${period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달'} 매출`}
          value={`₩${stats?.totalSales.toLocaleString() || '0'}`}
          change={stats?.totalSalesChange || ''}
          changeLabel="대비"
          icon={<TrendingUp size={20} />}
          iconClass="statIconInfo"
        />
        <StatCard
          title="방문 고객"
          value={stats?.customerCount.toString() || '0'}
          change={stats?.customerCountChange || ''}
          changeLabel="대비"
          icon={<Users size={20} />}
          iconClass="statIconWarning"
        />
      </div>

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
          {/* Recent Orders */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>최근 주문 (5건)</h2>
              <Link href="/admin/orders" className={styles.seeMore}>전체보기 <ChevronRight size={16} /></Link>
            </div>

            <div className={styles.recentOrdersList}>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const statusInfo = getStatusLabel(order.status);
                  return (
                    <div key={order.id} className={styles.orderRow}>
                      <div className={styles.orderMain}>
                        <div className={styles.orderNumber}>{order.displayNumber}</div>
                        <div className={styles.orderInfo}>
                          <div className={styles.orderCustomer}>{order.customerName} {order.isGuest ? '(비회원)' : '(회원)'}</div>
                          <div className={styles.orderSummary}>{order.summary}</div>
                        </div>
                      </div>
                      <div className={styles.orderRight}>
                        <div className={styles.orderAmount}>₩{order.totalPrice.toLocaleString()}</div>
                        <div className={`${styles.statusBadgeSmall} ${statusInfo.color}`}>{statusInfo.label}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>최근 주문이 없습니다.</div>
              )}
            </div>
          </section>

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
          {/* Popular Menus */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>인기 메뉴 TOP 5</h2>
              <Link href="/admin/sales" className={styles.seeMore}>상세보기</Link>
            </div>
            <div className={styles.popularList}>
              {popularMenus.length > 0 ? (
                popularMenus.map((menu) => (
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

          {/* Store Settings */}
          <section className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
            <h2 className={styles.sectionTitle}>영업 시간 설정</h2>
            <div className={styles.storeManager}>
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

function StatCard({ title, value, change, changeLabel, icon, iconClass }: any) {
  const isPositive = change.startsWith('+');
  const isNegative = change.startsWith('-');

  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statTitle}>{title}</span>
        <div className={`${styles.statIcon} ${styles[iconClass]}`}>
          {icon}
        </div>
      </div>
      <div className={styles.statValue}>{value}</div>
      {change && (
        <div className={`${styles.statChange} ${isNegative ? styles.statChangeNegative : ''}`}>
          {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
          <span>{change}</span>
          <span style={{ color: 'var(--color-gray-400)' }}>{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
