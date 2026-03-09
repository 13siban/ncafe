'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Coffee, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { MenuList } from '@/components/menu/MenuList/MenuList';
import { MenuCard } from '@/components/menu/MenuCard/MenuCard';
import { MenuActionBar } from '@/components/menu/MenuActionBar/MenuActionBar';
import CategoryTabs from '@/components/menu/CategoryTabs/CategoryTabs';
import { Footer } from '@/components/common';
import styles from './page.module.css';

export default function PublicMenusPage() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const totalItems = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

    return (
        <div className={styles.wrapper}>
            {/* Public Navigation */}
            <nav className={styles.nav}>
                <div className={styles.navContainer}>
                    <Link href="/" className={styles.logo}>
                        <Coffee size={24} />
                        <span>NCafe</span>
                    </Link>
                    <div className={styles.navLinks}>
                        <Link href="/menus" className={styles.activeLink}>Menu</Link>
                        <Link href="/order/my">My Order</Link>
                        <Link href="/about">About</Link>
                        <Link href="/locations">Locations</Link>
                    </div>
                    <div className={styles.navActions}>
                        <Link href="/cart" className={styles.cartLink}>
                            <ShoppingBag size={24} />
                            {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                        </Link>
                        <Link href="/admin" className={styles.adminLink}>
                            Admin
                        </Link>
                    </div>
                </div>
            </nav>

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
