'use client';

import React from 'react';
import { Search } from 'lucide-react';
import styles from './MenuActionBar.module.css';

interface MenuActionBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    /** 추가 액션 버튼 영역 (예: admin "새 메뉴 등록" 버튼) */
    children?: React.ReactNode;
}

export const MenuActionBar = ({
    searchQuery,
    onSearchChange,
    children,
}: MenuActionBarProps) => {
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
                {/* Extra actions (admin buttons etc.) */}
                {children}
            </div>
        </div>
    );
};

export default MenuActionBar;
