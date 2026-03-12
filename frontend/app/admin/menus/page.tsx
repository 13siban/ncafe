'use client';

/**
 * 관리자 메뉴 관리 페이지
 * - admin 래퍼 컴포넌트를 사용하여 admin 전용 기능 제공
 */

import React, { useState } from 'react';
import { MenuList } from './_components/MenuList/MenuList';
import { MenuActionBar } from './_components/MenuActionBar/MenuActionBar';
import CategoryTabs from './_components/CategoryTabs/CategoryTabs';
import styles from './page.module.css';

export default function AdminMenusPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className={styles.container}>
      <CategoryTabs
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className={styles.contentArea}>
        <MenuActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <MenuList
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  );
}