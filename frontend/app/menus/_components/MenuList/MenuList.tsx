'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UtensilsCrossed, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { MenuCard } from '../MenuCard/MenuCard';
import styles from './MenuList.module.css';
import { useMenus } from './useMenus';

interface MenuListProps {
    selectedCategory: number | null;
    searchQuery: string;
}

const ITEMS_PER_PAGE = 9;

export const MenuList = ({
    selectedCategory,
    searchQuery = '',
}: MenuListProps) => {

    const viewMode = 'grid';

    // State Management (using hook)
    const { menus, isLoading, error } = useMenus({
        categoryId: selectedCategory,
        searchQuery,
        onlyAvailable: true // Public view only shows available menus
    });

    const [currentPage, setCurrentPage] = useState(1);

    // Reset page when category or search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery]);

    // Paginated menus for current page
    const paginatedMenus = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return menus.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [menus, currentPage]);

    const totalPages = Math.ceil(menus.length / ITEMS_PER_PAGE);

    // Loading State
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>메뉴를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <UtensilsCrossed size={32} />
                    <h2>오류가 발생했습니다</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {menus.length > 0 ? (
                <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                    {paginatedMenus.map((menu) => (
                        <MenuCard
                            key={menu.id}
                            menu={menu}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <UtensilsCrossed size={32} />
                    </div>
                    <h2 className={styles.emptyTitle}>
                        {searchQuery ? '검색 결과가 없습니다' : '등록된 메뉴가 없습니다'}
                    </h2>
                    <p className={styles.emptyDescription}>
                        {searchQuery
                            ? '다른 검색어를 입력해 보세요.'
                            : '현재 준비된 메뉴가 없습니다.'}
                    </p>
                </div>
            )}

            {/* Paging UI */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageButton}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className={styles.pageNumbers}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        className={styles.pageButton}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MenuList;
