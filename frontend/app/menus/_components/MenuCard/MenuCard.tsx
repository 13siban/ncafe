'use client';

import React from 'react';
import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import styles from './MenuCard.module.css';
import { MenuResponse } from '../MenuList/useMenus';

interface MenuCardProps {
    menu: MenuResponse;
}

export const MenuCard = ({
    menu,
}: MenuCardProps) => {

    const imageSrc = menu?.imageSrc || '';

    const formatPrice = (price: number) => {
        const formatted = new Intl.NumberFormat('ko-KR').format(price || 0);
        return `₩\u00A0\u00A0${formatted}\u00A0\u00A0KRW`;
    };

    return (
        <div className={`${styles.menuCard} ${!menu.isOrderable ? styles.soldOutOverlay : ''}`}>
            {/* Image Section */}
            <div className={styles.imageContainer}>
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
                </div>
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
                </div>
            </div>
        </div>
    );
};

export default MenuCard;
