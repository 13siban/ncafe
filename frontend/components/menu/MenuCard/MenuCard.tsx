'use client';

import React from 'react';
import Image from 'next/image';
import { UtensilsCrossed, Plus } from 'lucide-react';
import styles from './MenuCard.module.css';
import { MenuResponse } from '../types';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'react-hot-toast';

interface MenuCardProps {
    menu: MenuResponse;
    /** 이미지 위에 오버레이할 추가 요소 (예: admin 액션 버튼) */
    imageOverlay?: React.ReactNode;
    /** 기본 뱃지(품절) 외 추가 뱃지 (예: admin 숨김 뱃지) */
    extraBadges?: React.ReactNode;
    /** 푸터에 추가할 액션 (예: admin 판매 토글) */
    footerActions?: React.ReactNode;
    /** 이미지 클릭 핸들러 */
    onImageClick?: () => void;
    /** 추가 className */
    className?: string;
}

export const MenuCard = ({
    menu,
    imageOverlay,
    extraBadges,
    footerActions,
    onImageClick,
    className,
}: MenuCardProps) => {
    const addItem = useCartStore((state) => state.addItem);
    const imageSrc = menu?.imageSrc || '';

    const formatPrice = (price: number) => {
        const formatted = new Intl.NumberFormat('ko-KR').format(price || 0);
        return `₩\u00A0\u00A0${formatted}\u00A0\u00A0KRW`;
    };

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (menu.isSoldOut) return;

        addItem({
            cartId: `${menu.id}-`,
            menuId: menu.id,
            menuName: menu.korName,
            menuEngName: menu.engName,
            imageSrc: menu.imageSrc || '',
            basePrice: menu.price,
            quantity: 1,
            selectedOptions: [],
            optionTotalPrice: 0,
            subtotal: menu.price
        });

        toast.success(`장바구니에 ${menu.korName}을 담았습니다`);
    };

    return (
        <div className={`${styles.menuCard} ${className || ''}`}>
            {/* Image Section */}
            <div
                className={styles.imageContainer}
                onClick={onImageClick}
                role={onImageClick ? 'button' : undefined}
                tabIndex={onImageClick ? 0 : undefined}
                onKeyDown={onImageClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') onImageClick();
                } : undefined}
            >
                <div className={styles.imageClipper}>
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
                </div>

                {/* Quick Add Button */}
                {!menu.isSoldOut && (
                    <div
                        className={styles.quickAddButton}
                        onClick={handleQuickAdd}
                        onMouseDown={(e) => e.stopPropagation()}
                        aria-label="장바구니에 담기"
                        role="button"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </div>
                )}

                {/* Badges */}
                <div className={styles.badges}>
                    {menu.isSoldOut && (
                        <span className={`${styles.badge} ${styles.soldOutBadge}`}>품절</span>
                    )}
                    {extraBadges}
                </div>

                {/* Overlay slot (admin: action buttons) */}
                {imageOverlay}
            </div>

            {/* Content Section */}
            <div className={styles.content}>
                <div className={styles.infoBlock}>
                    <div className={styles.names}>
                        <h3 className={styles.engName}>{menu.engName}</h3>
                        <p className={styles.korName}>{menu.korName}</p>
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
                    {footerActions}
                </div>
            </div>
        </div>
    );
};

export default MenuCard;
