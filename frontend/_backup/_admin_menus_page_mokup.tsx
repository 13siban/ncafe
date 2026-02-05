'use client';

/**
 * 관리자 메뉴 관리 페이지
 * - 메뉴 목록 조회, 품절 처리, 삭제 등의 기능을 제공합니다.
 */

import { arrayMove } from '@dnd-kit/sortable';
import React, { useState, useMemo } from 'react';
import { MenuList } from '../app/admin/menus/_components/MenuList/MenuList';
import { MenuActionBar, ViewMode } from '../app/admin/menus/_components/MenuActionBar/MenuActionBar';
import { CategoryTabs } from '../app/admin/menus/_components/CategoryTabs/CategoryTabs';
import { categories, menus as initialMenus } from '@/mocks/menuData';
import { Menu } from '@/types/menu';
import styles from './page.module.css';

export default function MenusPage() {
  // 1. 상태 관리
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // 2. 파생 데이터 계산
  // 카테고리별 메뉴 개수 계산
  const menuCounts = useMemo(() => {
    const counts: Record<string, number> = { all: menus.length };
    menus.forEach((menu) => {
      const catId = menu.category.id;
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [menus]);

  // 필터링된 메뉴 목록
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchesCategory = activeCategory === 'all' || menu.category.id === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        menu.korName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.engName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menus, activeCategory, searchQuery]);

  /**
   * 메뉴 품절 상태 변경 핸들러
   * @param menuId 변경할 메뉴의 ID
   * @param isSoldOut 새로운 품절 상태 (true: 품절, false: 판매중)
   */
  const handleSoldOutToggle = (menuId: string, isSoldOut: boolean) => {
    setMenus((prevMenus) =>
      prevMenus.map((menu) =>
        menu.id === menuId ? { ...menu, isSoldOut } : menu
      )
    );
  };

  /**
   * 메뉴 삭제 핸들러
   * @param menuId 삭제할 메뉴의 ID
   */
  const handleDelete = (menuId: string) => {
    // 사용자 확인 후 삭제 처리 (실제 환경에서는 API 호출 필요)
    if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
      setMenus((prevMenus) => prevMenus.filter((menu) => menu.id !== menuId));
    }
  };

  /**
   * 메뉴 순서 변경 핸들러
   * @param activeId 드래그 중인 메뉴 ID
   * @param overId 드롭 대상 메뉴 ID
   */
  const handleReorder = (activeId: string, overId: string) => {
    setMenus((prevMenus) => {
      const oldIndex = prevMenus.findIndex((menu) => menu.id === activeId);
      const newIndex = prevMenus.findIndex((menu) => menu.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(prevMenus, oldIndex, newIndex);
      }
      return prevMenus;
    });
  };

  return (

      <main className={styles.container}>
        {/* 상단 액션 바 */}
        <MenuActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        {/* 카테고리 탭 */}
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          menuCounts={menuCounts}
        />

        {/* 메뉴 목록 */}
        <MenuList
          menus={filteredMenus}
          viewMode={viewMode}
          searchQuery={searchQuery}
          onSoldOutToggle={handleSoldOutToggle}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      </main>
  );
}
