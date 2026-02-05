'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, UtensilsCrossed, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common';
import { MenuCard } from '../MenuCard';
import styles from './MenuList.module.css';

import { useMenus } from './useMenus';

type ViewMode = 'grid' | 'list';

interface MenuListProps {
    selectedCategory: number | null;
    searchQuery: string;
    // viewMode: ViewMode;
}

const ITEMS_PER_PAGE = 8;


export const MenuList = ({
    selectedCategory,
    searchQuery = '',
    // viewMode,
}: MenuListProps) => {

    let viewMode = 'grid';

    // 상태 관리 (훅 사용)
    const { menus, setMenus, total, isLoading, error } = useMenus({ categoryId: selectedCategory, searchQuery });
    const [currentPage, setCurrentPage] = useState(1);


    // 페이지가 변경되거나 검색어가 변경되면 페이지를 1로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery]);

    // 현재 페이지에 표시할 메뉴
    const paginatedMenus = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return menus.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [menus, currentPage]);

    const totalPages = Math.ceil(menus.length / ITEMS_PER_PAGE);

    /**
     * 메뉴 노출 상태 변경 핸들러
     */
    const handleAvailableToggle = (menuId: number, isAvailable: boolean) => {
        setMenus((prevMenus) =>
            prevMenus.map((menu) =>
                menu.id === menuId ? { ...menu, isAvailable } : menu
            )
        );
        // TODO: 백엔드 API 호출하여 상태 동기화
    };

    /**
     * 메뉴 삭제 핸들러
     */
    const handleDelete = (menuId: number) => {
        if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
            setMenus((prevMenus) => prevMenus.filter((menu) => menu.id !== menuId));
            // TODO: 백엔드 API 호출하여 삭제 동기화
        }
    };


    // 로딩 상태
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

    // 에러 상태
    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <UtensilsCrossed size={32} />
                    <h2>오류가 발생했습니다</h2>
                    <p>{error}</p>
                    <Button onClick={() => window.location.reload()}>다시 시도</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {menus.length > 0 ? (
                <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                    {/* {menus.map((menu) => (
                        <div key={menu.id}>
                            <div>{menu.korName}</div>
                            <div>{menu.engName}</div>
                            <p style={{ color: 'gray', fontSize: '10px' }}>{`<${menu.categoryName}>`}</p>
                            <p style={{ color: 'gray', fontSize: '10px' }}>{menu.description}</p>
                            <div>{menu.price}</div>
                            <div>{menu.isAvailable}</div>
                        </div>
                    ))} */}
                    {paginatedMenus.map((menu) => (
                        <MenuCard
                            key={menu.id}
                            menu={menu}
                            onAvailableToggle={handleAvailableToggle}
                            onDelete={handleDelete}
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
                            : '새 메뉴를 등록하여 시작하세요.'}
                    </p>
                    {!searchQuery && (
                        <Link href="/admin/menus/new">
                            <Button leftIcon={<Plus size={18} />}>새 메뉴 등록</Button>
                        </Link>
                    )}
                </div>
            )}

            {/* 페이징 UI */}
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
                                className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ''
                                    }`}
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

