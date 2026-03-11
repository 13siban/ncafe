'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UtensilsCrossed, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { MenuCard } from '../MenuCard/MenuCard';
import styles from './MenuList.module.css';
import { useMenus } from './useMenus';
import { MenuResponse, MenuMode } from '../types';

import { motion, Variants } from 'framer-motion';

interface MenuListProps {
    selectedCategory: number | null;
    searchQuery: string;
    mode?: MenuMode;
    /** 외부에서 메뉴 상태를 관리할 경우 사용 */
    menus?: MenuResponse[];
    setMenus?: React.Dispatch<React.SetStateAction<MenuResponse[] | undefined>>;
    /** 카드를 커스터마이징할 수 있는 렌더 함수 */
    renderCard?: (menu: MenuResponse) => React.ReactNode;
    /** 빈 상태에 추가할 액션 */
    emptyAction?: React.ReactNode;
    /** 에러 상태에 추가할 액션 */
    errorAction?: React.ReactNode;
    /** 메뉴 상태 변경 시 부모에게 전달 */
    onMenusChange?: (menus: MenuResponse[] | undefined) => void;
}

const ITEMS_PER_PAGE = 9;

// 애니메이션 베리언트 정의
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08, // 각 카드별 등장 간격
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
    },
};

export const MenuList = ({
    selectedCategory,
    searchQuery = '',
    mode = 'public',
    renderCard,
    emptyAction,
    errorAction,
    onMenusChange,
    menus: externalMenus,
    setMenus: externalSetMenus,
}: MenuListProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToContent = () => {
        if (typeof window !== 'undefined' && containerRef.current) {
            const offset = 80; // 헤더 높이 등을 고려한 여백
            const elementPosition = containerRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const internalState = useMenus({
        categoryId: selectedCategory,
        searchQuery,
        mode,
    });

    // 외부 상태가 있으면 그것을 사용, 없으면 hook 내부 상태 사용
    const menus = externalMenus !== undefined ? externalMenus : internalState.menus;
    const setMenus = externalSetMenus !== undefined ? externalSetMenus : internalState.setMenus;
    const { total, isLoading, error } = internalState;

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
        // 카테고리나 검색어 변경 시 메뉴 리스트 위치로 스크롤 이동
        scrollToContent();
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        if (!isLoading) {
            onMenusChange?.(internalState.menus);
        }
    }, [internalState.menus, onMenusChange, isLoading]);

    // 페이지 번호 변경 시에도 메뉴 리스트 위치로 스크롤
    useEffect(() => {
        if (isMounted) {
            scrollToContent();
        }
    }, [currentPage]);
    
    // isMounted check to prevent initial scroll on mount
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const paginatedMenus = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return menus.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [menus, currentPage]);

    const totalPages = Math.ceil(menus.length / ITEMS_PER_PAGE);

    // Loading
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

    // Error
    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <UtensilsCrossed size={32} />
                    <h2>오류가 발생했습니다</h2>
                    <p>{error}</p>
                    {errorAction}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={containerRef}>
            {menus.length > 0 ? (
                <div
                    key={`${selectedCategory}-${searchQuery}-${currentPage}`}
                    className={styles.grid}
                >
                    {paginatedMenus.map((menu, index) => (
                        <motion.div
                            key={menu.id}
                            variants={itemVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{
                                duration: 0.5,
                                ease: [0.21, 0.47, 0.32, 0.98],
                                // 그리드 한 줄(3개) 안에서 주어지는 순차적 딜레이 효과 유지
                                delay: (index % 3) * 0.15
                            }}
                        >
                            {renderCard
                                ? renderCard(menu)
                                : <MenuCard menu={menu} />
                            }
                        </motion.div>
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
                    {emptyAction}
                </div>
            )}

            {/* Pagination */}
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
