'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { MenuList } from '@/components/menu/MenuList/MenuList';
import { MenuCard } from '@/components/menu/MenuCard/MenuCard';
import { MenuActionBar } from '@/components/menu/MenuActionBar/MenuActionBar';
import CategoryTabs from '@/components/menu/CategoryTabs/CategoryTabs';
import { Header, Footer } from '@/components/common';
import styles from './page.module.css';

export default function PublicMenusPage() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.container}>
                <CategoryTabs
                    selected={selectedCategory}
                    onSelect={setSelectedCategory}
                />

                <div className={styles.contentArea}>
                    <MenuActionBar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    <MenuList
                        selectedCategory={selectedCategory}
                        searchQuery={searchQuery}
                        renderCard={(menu) => (
                            <Link
                                href={`/menus/${menu.id}`}
                                key={menu.id}
                                style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}
                            >
                                <MenuCard menu={menu} />
                            </Link>
                        )}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}
