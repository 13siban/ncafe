'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UtensilsCrossed, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { MenuCard } from '../MenuCard/MenuCard';
import styles from './MenuList.module.css';
import { useMenus } from './useMenus';
import { MenuResponse, MenuMode } from '../types';

import { motion, Variants } from 'framer-motion';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface DragHandleProps {
    attributes: Record<string, any>;
    listeners: Record<string, any> | undefined;
}

interface MenuListProps {
    selectedCategory: number | null;
    searchQuery: string;
    mode?: MenuMode;
    /** 외부에서 메뉴 상태를 관리할 경우 사용 */
    menus?: MenuResponse[];
    setMenus?: React.Dispatch<React.SetStateAction<MenuResponse[] | undefined>>;
    /** 카드를 커스터마이징할 수 있는 렌더 함수 */
    renderCard?: (menu: MenuResponse, dragHandleProps?: DragHandleProps) => React.ReactNode;
    /** 빈 상태에 추가할 액션 */
    emptyAction?: React.ReactNode;
    /** 에러 상태에 추가할 액션 */
    errorAction?: React.ReactNode;
    /** 메뉴 상태 변경 시 부모에게 전달 */
    onMenusChange?: (menus: MenuResponse[] | undefined) => void;
    /** DnD 정렬 활성화 (admin 모드에서 사용) */
    sortable?: boolean;
    /** DnD 순서 변경 완료 시 호출되는 콜백 */
    onReorder?: (reorderedMenus: MenuResponse[]) => void;
}

const ITEMS_PER_PAGE = 9;

// 애니메이션 베리언트 정의
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
    },
};

// DnD용 SortableItem 래퍼 - 핸들은 renderCard에서 직접 렌더
function SortableItem({ id, children }: { id: number; children: (dragHandleProps: DragHandleProps) => React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children({ attributes, listeners })}
        </div>
    );
}

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
    sortable = false,
    onReorder,
}: MenuListProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToContent = () => {
        if (typeof window !== 'undefined' && containerRef.current) {
            const offset = 80;
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

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        setCurrentPage(1);
        scrollToContent();
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        if (!isLoading) {
            onMenusChange?.(internalState.menus);
        }
    }, [internalState.menus, onMenusChange, isLoading]);

    useEffect(() => {
        if (isMounted) {
            scrollToContent();
        }
    }, [currentPage]);
    
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // DnD가 활성화되면 페이지네이션 없이 전체 표시
    const displayMenus = useMemo(() => {
        if (sortable) return menus;
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return menus.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [menus, currentPage, sortable]);

    const totalPages = sortable ? 1 : Math.ceil(menus.length / ITEMS_PER_PAGE);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = menus.findIndex(m => m.id === active.id);
        const newIndex = menus.findIndex(m => m.id === over.id);
        const reordered = arrayMove(menus, oldIndex, newIndex).map((m, i) => ({
            ...m,
            sortOrder: i + 1,
        }));

        setMenus(reordered as any);
        onReorder?.(reordered);
    };

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

    const renderCardItem = (menu: MenuResponse, index: number) => {
        if (sortable) {
            return (
                <SortableItem key={menu.id} id={menu.id}>
                    {(dragHandleProps) => {
                        const cardContent = renderCard ? renderCard(menu, dragHandleProps) : <MenuCard menu={menu} />;
                        return cardContent;
                    }}
                </SortableItem>
            );
        }

        const cardContent = renderCard ? renderCard(menu) : <MenuCard menu={menu} />;

        return (
            <motion.div
                key={menu.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                    duration: 0.5,
                    ease: [0.21, 0.47, 0.32, 0.98],
                    delay: (index % 3) * 0.15
                }}
            >
                {cardContent}
            </motion.div>
        );
    };

    const gridContent = (
        <>
            {menus.length > 0 ? (
                <div
                    key={`${selectedCategory}-${searchQuery}-${currentPage}`}
                    className={styles.grid}
                >
                    {displayMenus.map((menu, index) => renderCardItem(menu, index))}
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

            {/* Pagination (DnD 모드에서는 숨김) */}
            {!sortable && totalPages > 1 && (
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
        </>
    );

    return (
        <div className={styles.container} ref={containerRef}>
            {sortable ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={menus.map(m => m.id)} strategy={rectSortingStrategy}>
                        {gridContent}
                    </SortableContext>
                </DndContext>
            ) : (
                gridContent
            )}
        </div>
    );
};

export default MenuList;
