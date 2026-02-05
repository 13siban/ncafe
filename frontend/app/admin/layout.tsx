'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './_components/AdminSidebar';
import { AdminHeader } from './_components/AdminHeader';
import styles from './layout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const getPageConfig = (path: string) => {

    if (path === '/admin/menus') {
      return {
        title: '메뉴 관리',
        breadcrumbs: [{ label: '홈' }, { label: '메뉴 관리' }]
      };
    }
    if (path === '/admin/menus/new') {
      return {
        title: '메뉴 등록',
        breadcrumbs: [{ label: '홈' }, { label: '메뉴 관리' }, { label: '메뉴 등록' }]
      };
    }
    if (path.startsWith('/admin/menus/')) {
      const parts = path.split('/');
      // /admin/menus/[id]
      if (parts.length === 4) { 
        return {
          title: '메뉴 상세',
          breadcrumbs: [{ label: '홈' }, { label: '메뉴 관리' }, { label: '메뉴 상세' }]
        };
      }
      // /admin/menus/[id]/edit
      if (parts.length === 5 && parts[4] === 'edit') {
        return {
          title: '메뉴 수정',
          breadcrumbs: [{ label: '홈' }, { label: '메뉴 관리' }, { label: '메뉴 상세' }, { label: '수정' }]
        };
      }
    }
    // 기본값 (대시보드 등)
    return {
      title: '대시보드',
      breadcrumbs: [{ label: '홈' }]
    };
  };

  const { title, breadcrumbs } = getPageConfig(pathname);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <div className={styles.mainContent}>
        <AdminHeader 
          onMenuClick={toggleSidebar} 
          title={title}
          breadcrumbs={breadcrumbs}
        />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
