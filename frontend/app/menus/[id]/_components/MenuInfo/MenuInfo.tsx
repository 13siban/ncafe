'use client';

import React from 'react';
import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import styles from '../../page.module.css';
import { MenuDetailResponse } from '../../types';

interface MenuInfoProps {
    menu: MenuDetailResponse;
}

export function MenuInfo({ menu }: MenuInfoProps) {
    const imageSrc = menu.images && menu.images.length > 0 ? menu.images[0].srcUrl : null;

    return (
        <>
            <div className={styles.imageSection}>
                {imageSrc ? (
                    <Image
                        src={`/images/${imageSrc}`}
                        alt={menu.korName}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 800px"
                        priority
                    />
                ) : (
                    <div className={styles.placeholder}>
                        <UtensilsCrossed size={64} strokeWidth={1} />
                    </div>
                )}
            </div>

            <div className={styles.infoSection}>
                <div className={styles.names}>
                    <h2>{menu.engName}</h2>
                    <h1>{menu.korName}</h1>
                </div>
                <p className={styles.description}>{menu.description}</p>
            </div>
        </>
    );
}
