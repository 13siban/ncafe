'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/app/lib/api';
import { MenuResponse } from '@/components/menu/types';
import styles from './SignatureSection.module.css';
import { motion } from 'framer-motion';

export function SignatureSection() {
    const [menus, setMenus] = useState<MenuResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSignatureMenus = async () => {
            try {
                // Get available menus, they are returned in sortOrder ascending
                const data = await fetchAPI('/menus?onlyAvailable=true');
                if (data && Array.isArray(data.menus)) {
                    // Get the first 4 items (the ones with the fastest index / smallest sortOrder)
                    setMenus(data.menus.slice(0, 4));
                }
            } catch (error) {
                console.error('Failed to fetch signature menus:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSignatureMenus();
    }, []);

    if (isLoading) {
        return <div className={styles.loading}>메뉴를 불러오는 중...</div>;
    }

    if (menus.length === 0) {
        return null;
    }

    return (
        <section className={styles.container}>
            <motion.h2
                className={styles.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.6 }}
            >
                Signature Menu
            </motion.h2>

            <div className={styles.menuList}>
                {menus.map((menu, index) => {
                    const href = `/menus/${menu.engName ? menu.engName.toLowerCase().replace(/\s+/g, '-') : menu.id}`;
                    return (
                        <motion.div
                            key={menu.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                        >
                            <Link href={href} className={styles.menuItem}>
                                <div className={styles.imageContainer}>
                                    <img
                                        src={menu.imageSrc ? `/api/upload/${menu.imageSrc}` : '/images/placeholder.png'}
                                        alt={menu.korName}
                                        className={styles.image}
                                    />
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.header}>
                                        <div className={styles.nameGroup}>
                                            <h3 className={styles.name}>{menu.engName || menu.korName}</h3>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
