'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Grid, List, Plus } from 'lucide-react';
import { Button } from '@/components/common';
import styles from './MenuActionBar.module.css';

export type ViewMode = 'grid' | 'list';

interface MenuActionBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void; //콜백으로 반환
  // viewMode: ViewMode;
  // onViewModeChange: (mode: ViewMode) => void; //콜백으로 반환
}

export const MenuActionBar = ({
  searchQuery,
  onSearchChange,
  // viewMode,
  // onViewModeChange,
}: MenuActionBarProps) => {

  let viewMode = 'grid';
  let onViewModeChange = (mode: ViewMode) => {
    console.log('보기 모드 변경:', mode);
  };

  return (
    <div className={styles.container}>
      {/* Search */}
      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="메뉴 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
            onClick={() => onViewModeChange('grid')}
            aria-label="그리드 보기"
          >
            <Grid size={18} />
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
            onClick={() => onViewModeChange('list')}
            aria-label="리스트 보기"
          >
            <List size={18} />
          </button>
        </div>

        {/* New Menu Button */}
        <Link href="/admin/menus/new">
          <Button leftIcon={<Plus size={18} />}>
            새 메뉴 등록
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default MenuActionBar;
