'use client';

import React from 'react';
import { Search, Grid, List } from 'lucide-react';
import styles from './MenuActionBar.module.css';

export type ViewMode = 'grid' | 'list';

interface MenuActionBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const MenuActionBar = ({
    searchQuery,
    onSearchChange,
}: MenuActionBarProps) => {

    const viewMode = 'grid'; // Currently fixed to grid as per original design

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
                        disabled
                        aria-label="그리드 보기"
                    >
                        <Grid size={18} />
                    </button>
                    {/* <button
                        className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
                        disabled
                        aria-label="리스트 보기"
                    >
                        <List size={18} />
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default MenuActionBar;
