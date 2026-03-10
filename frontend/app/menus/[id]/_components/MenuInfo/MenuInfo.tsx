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
    return (
        <div className={styles.infoSection}>
            <span className={styles.eyebrow}>
                {menu.categoryName || 'OUR SPECIALTY'}
            </span>
            <div className={styles.names}>
                <h1>{menu.engName || menu.korName}</h1>
                {menu.engName && <h2>{menu.korName}</h2>}
            </div>
            <p className={styles.description}>{menu.description}</p>
        </div>
    );
}
