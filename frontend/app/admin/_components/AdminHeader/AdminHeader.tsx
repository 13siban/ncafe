'use client';

import React from 'react';
import { Menu, Search, Bell, HelpCircle } from 'lucide-react';
import styles from './AdminHeader.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  breadcrumbs = [],
  onMenuClick,
}) => {
  return (
    <header className={styles.header}>
      {/* Left Section */}
      <div className={styles.leftSection}>
        <button className={styles.menuButton} onClick={onMenuClick} aria-label="메뉴 열기">
          <Menu size={24} />
        </button>
        
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className={styles.breadcrumbCurrent}>{item.label}</span>
                ) : (
                  <span>{item.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* Right Section */}
      <div className={styles.rightSection}>
        {/* Search */}
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="검색..."
            className={styles.searchInput}
          />
          <span className={styles.searchShortcut}>⌘K</span>
        </div>

        {/* Help */}
        <button className={styles.iconButton} aria-label="도움말">
          <HelpCircle size={20} />
        </button>

        {/* Notifications */}
        <button className={styles.iconButton} aria-label="알림">
          <Bell size={20} />
          <span className={styles.notificationBadge} />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
