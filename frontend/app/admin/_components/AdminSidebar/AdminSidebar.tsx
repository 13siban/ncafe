'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Coffee,
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Sliders,
  BarChart3,
  Brain,
} from 'lucide-react';
import styles from './AdminSidebar.module.css';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Logo } from '@/components/common/Logo/Logo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

// mainNavItems를 컴포넌트 내부로 이동 (다이내믹 데이터 연동을 위해)

const settingsNavItems: NavItem[] = [
  { label: '설정', href: '/admin/settings', icon: <Settings size={20} /> },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen = true,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const pathname = usePathname();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const [menuCount, setMenuCount] = React.useState<number>(0);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      // 세션 정보가 없으면 확인
      if (!user) {
        await checkAuth();
      }

      try {
        const menusRes = await apiFetch('/api/admin/menus');
        if (menusRes.ok) {
          const menusData = await menusRes.json();
          const count = Array.isArray(menusData) ? menusData.length : (menusData.menus?.length || 0);
          setMenuCount(count);
        }
      } catch (error) {
        console.error('Sidebar data fetch error:', error);
      }
    };

    fetchData();
  }, [user, checkAuth]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const navItems = [
    { label: '대시보드', href: '/admin', icon: <LayoutDashboard size={20} /> },
    {
      label: '메뉴 관리',
      href: '/admin/menus',
      icon: <UtensilsCrossed size={20} />,
      badge: menuCount > 0 ? menuCount : undefined,
    },
    { label: '옵션 관리', href: '/admin/options', icon: <Sliders size={20} /> },
    { label: '주문 관리', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
    { label: '매출 분석', href: '/admin/sales', icon: <BarChart3 size={20} /> },
    { label: '회원 관리', href: '/admin/users', icon: <Users size={20} /> },
    { label: 'AI RAG 관리', href: '/admin/rag', icon: <Brain size={20} /> },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    // query parameter가 있는 경우와 없는 경우 모두 대응
    return pathname === href || pathname.startsWith(href + '?') || (href !== '/admin' && pathname.startsWith(href + '/'));
  };

  const isBaseActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
        {/* Collapse Toggle Button (Desktop) */}
        <button
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Logo */}
        {/* Logo */}
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <Logo variant="black" className={styles.adminLogo} />
          </Link>
          <div className={styles.logoInfo}>
            <div className={styles.logoText}>mymyy</div>
            <div className={styles.logoSubtext}>Admin Panel</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {/* Main Section */}
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>메인 메뉴</div>
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`${styles.navItem} ${isBaseActive(item.href) ? styles.navItemActive : ''}`}
                    onClick={onClose}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Settings Section */}
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>설정</div>
            <ul className={styles.navList}>
              {settingsNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                    onClick={onClose}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer - User Info */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {isMounted && !isLoading ? (user ? (user.username || user.nickname).substring(0, 2).toUpperCase() : '??') : '...'}
            </div>
            <div>
              <div className={styles.userName}>
                {isMounted && !isLoading ? (user ? (user.username || user.nickname) : '로그인 필요') : '로딩 중...'}
              </div>
              <div className={styles.userRole}>
                {isMounted && !isLoading && user ? (user.role === 'ROLE_ADMIN' ? '관리자' : '사용자') : ''}
              </div>
            </div>
            {isMounted && !isLoading && user && (
              <button
                onClick={handleLogout}
                className={styles.logoutIconButton}
                title="로그아웃"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <LogOut size={18} style={{ color: 'var(--color-gray-400)' }} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
