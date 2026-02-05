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
  BarChart3
} from 'lucide-react';
import styles from './page.module.css';

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
  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>대시보드</h1>
        <p className={styles.subtitle}>오늘도 좋은 하루 되세요, 김사장님! ☕</p>
      </div>

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
  );
}
