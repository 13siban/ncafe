'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Eye, UtensilsCrossed } from 'lucide-react';
import styles from './MenuCard.module.css';
import { MenuResponse } from '../MenuList/useMenus';

interface MenuCardProps {
  menu: MenuResponse;
  onAvailableToggle?: (menuId: number, isAvailable: boolean) => void;
  onDelete?: (menuId: number) => void;
}

export const MenuCard = ({
  menu,
  onAvailableToggle,
  onDelete,
}: MenuCardProps) => {
  const router = useRouter();
  
  const imageSrc = menu?.imageSrc || '';

  const formatPrice = (price: number) => {
    const formatted = new Intl.NumberFormat('ko-KR').format(price || 0);
    return `₩\u00A0\u00A0${formatted}\u00A0\u00A0KRW`;
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAvailableToggle?.(menu.id, !menu.isAvailable);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`"${menu.korName}" 메뉴를 삭제하시겠습니까?`)) {
      onDelete?.(menu.id);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // 액션 버튼 영역 클릭 시에는 네비게이션하지 않음
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.actions}`)) {
      return;
    }
    router.push(`/admin/menus/${menu.id}`);
  };

  return (
    <div className={`${styles.menuCard} ${!menu.isAvailable ? styles.soldOutOverlay : ''}`}>
      {/* Image Section */}
      <div 
        className={styles.imageContainer}
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            router.push(`/admin/menus/${menu.id}`);
          }
        }}
      >
        {imageSrc ? (
          <Image
            src={`/images/${imageSrc}`}
            alt={menu.korName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.menuImage}
            priority={false}
          />
        ) : (

          <div className={styles.placeholder}>
            <UtensilsCrossed size={40} strokeWidth={1.5} />
          </div>
        )}
        
        {/* Badges */}
        <div className={styles.badges}>
          {menu.isSoldOut && (
            <span className={`${styles.badge} ${styles.soldOutBadge}`}>품절</span>
          )}
          {!menu.isAvailable && (
            <span className={`${styles.badge} ${styles.hiddenBadge}`}>숨김</span>
          )}
        </div>
        


        {/* Action Buttons */}
        <div className={styles.actions}>

          <Link
            href={`/admin/menus/${menu.id}`}
            className={styles.actionButton}
            title="상세보기"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye size={18} />
          </Link>
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
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        <div className={styles.infoBlock}>
          <div className={styles.names}>
            <h3 className={styles.korName}>{menu.korName}</h3>
            <p className={styles.engName}>{menu.engName}</p>
          </div>
          <p className={styles.description}>{menu.description}</p>
        </div>
        
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(menu.price)}</span>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.category}>
            {menu.categoryName && <span>{menu.categoryName}</span>}
          </div>

          {/* Availability Toggle */}
          <div className={styles.toggleWrapper}>
            <span className={styles.toggleLabel}>판매중</span>
            <button
              className={`${styles.toggle} ${menu.isAvailable ? styles.toggleActive : ''}`}
              onClick={handleToggle}
              aria-label={menu.isAvailable ? '숨김으로 변경' : '판매중으로 변경'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
