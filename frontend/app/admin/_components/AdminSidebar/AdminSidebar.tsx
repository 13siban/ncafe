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
  ChevronRight
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

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
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();
  const [menuCount, setMenuCount] = React.useState<number>(0);
  const [categories, setCategories] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [menusRes, catsRes] = await Promise.all([
          fetch('/api/admin/menus'),
          fetch('/api/admin/categories')
        ]);

        if (menusRes.ok) {
          const menus = await menusRes.json();
          setMenuCount(menus.length);
        }

        if (catsRes.ok) {
          const cats = await catsRes.json();
          setCategories(cats);
        }
      } catch (error) {
        console.error('Sidebar data fetch error:', error);
      }
    };

    fetchData();
  }, []);

  const navItems = [
    { label: '대시보드', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { 
      label: '메뉴 관리', 
      href: '/admin/menus', 
      icon: <UtensilsCrossed size={20} />, 
      badge: menuCount > 0 ? menuCount : undefined,
      subItems: categories.map(cat => ({
        label: cat.name || cat.korName,
        href: `/admin/menus?cid=${cat.id}`
      }))
    },
    { label: '주문 관리', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
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
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Coffee size={24} />
          </div>
          <div>
            <div className={styles.logoText}>NCafe</div>
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
                    {item.subItems && item.subItems.length > 0 && (
                      <ChevronRight 
                        size={16} 
                        className={`${styles.chevron} ${isBaseActive(item.href) ? styles.chevronOpen : ''}`} 
                      />
                    )}
                  </Link>
                  
                  {/* Submenu for categories */}
                  {item.subItems && item.subItems.length > 0 && isBaseActive(item.href) && (
                    <ul className={styles.subList}>
                      {item.subItems.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className={`${styles.subItem} ${pathname === sub.href ? styles.subItemActive : ''}`}
                            onClick={onClose}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
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
            <div className={styles.userAvatar}>JK</div>
            <div>
              <div className={styles.userName}>김사장</div>
              <div className={styles.userRole}>카페 관리자</div>
            </div>
            <LogOut size={18} style={{ marginLeft: 'auto', color: 'var(--color-gray-400)' }} />
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
