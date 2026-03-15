'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Eye, GripVertical } from 'lucide-react';
import { MenuCard as BaseMenuCard } from '@/components/menu/MenuCard/MenuCard';
import { MenuResponse } from '@/components/menu/types';
import { DragHandleProps } from '@/components/menu/MenuList/MenuList';
import styles from './MenuCard.module.css';

interface MenuCardProps {
    menu: MenuResponse;
    onAvailableToggle?: (menuId: number, isOrderable: boolean) => void;
    onDelete?: (menuId: number) => void;
    dragHandleProps?: DragHandleProps;
}

export const MenuCard = ({
    menu,
    onAvailableToggle,
    onDelete,
    dragHandleProps,
}: MenuCardProps) => {
    const router = useRouter();

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAvailableToggle?.(menu.id, !menu.isOrderable);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`"${menu.korName}" 메뉴를 삭제하시겠습니까?`)) {
            onDelete?.(menu.id);
        }
    };

    const handleImageClick = () => {
        router.push(`/admin/menus/${menu.id}`);
    };

    return (
        <BaseMenuCard
            menu={menu}
            className={!menu.isAvailable ? styles.hiddenOverlay : ''}
            onImageClick={handleImageClick}
            extraBadges={
                !menu.isAvailable ? (
                    <span className={styles.hiddenBadge}>숨김</span>
                ) : null
            }
            imageOverlay={
                <div className={styles.actions}>
                    <Link
                        href={`/admin/menus/${menu.id}`}
                        className={styles.actionButton}
                        title="상세보기"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Eye size={18} />
                    </Link>
                    {dragHandleProps && (
                        <div
                            className={`${styles.actionButton} ${styles.dragButton}`}
                            title="드래그하여 순서 변경"
                            {...dragHandleProps.attributes}
                            {...dragHandleProps.listeners}
                        >
                            <GripVertical size={18} />
                        </div>
                    )}
                    <Link
                        href={`/admin/menus/${menu.id}/edit`}
                        className={styles.actionButton}
                        title="수정"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Edit2 size={18} />
                    </Link>
                    <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="삭제"
                        onClick={handleDelete}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            }
            footerActions={
                <div className={styles.toggleWrapper}>
                    <span className={styles.toggleLabel}>판매중</span>
                    <button
                        className={`${styles.toggle} ${menu.isOrderable ? styles.toggleActive : ''}`}
                        onClick={handleToggle}
                        aria-label={menu.isOrderable ? '숨김으로 변경' : '판매중으로 변경'}
                    >
                        <span className={styles.toggleThumb} />
                    </button>
                </div>
            }
        />
    );
};

export default MenuCard;
