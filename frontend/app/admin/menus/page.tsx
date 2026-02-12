'use client';

/**
 * 관리자 메뉴 관리 페이지
 * - 메뉴 목록 조회, 품절 처리, 삭제 등의 기능을 제공합니다.
 */

import React, { useState } from 'react';
import { MenuList } from './_components/MenuList/MenuList';
import { MenuActionBar, ViewMode } from './_components/MenuActionBar/MenuActionBar';
import CategoryTabs from './_components/CategoryTabs/CategoryTabs';
import styles from './page.module.css';

export default function MenusPage() {
  // 1. 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // const [viewMode, setViewMode] = useState<ViewMode>('grid');

  console.log('[MenusPage] 현재 선택된 카테고리 ID:', selectedCategory);


  return (
    <main className={styles.container}>
      {/* 카테고리 탭 (사이드바) */}
      <CategoryTabs
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className={styles.contentArea}>
        {/* 상단 액션 바 */}
        <MenuActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 메뉴 목록 */}
        <MenuList
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  );
}


    // <main className={styles.container}>
    //   {/* 상단 액션 바 */}
    //   <MenuActionBar
    //     searchQuery={searchQuery}
    //     onSearchChange={setSearchQuery}
    //     viewMode={viewMode}
    //     onViewModeChange={setViewMode}
    //   />
      
    //   {/* 카테고리 탭 */}
    //   <CategoryTabs
    //     activeCategory={activeCategory}
    //     onCategoryChange={setActiveCategory}
    //   />

    //   {/* 메뉴 목록 */}
    //   <MenuList
    //     categoryId={activeCategory}
    //     viewMode={viewMode}
    //     searchQuery={searchQuery}
    //   />
    // </main>