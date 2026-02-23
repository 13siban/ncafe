'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { MenuList } from './_components/MenuList/MenuList';
import { MenuActionBar } from './_components/MenuActionBar/MenuActionBar';
import CategoryTabs from './_components/CategoryTabs/CategoryTabs';
import styles from './page.module.css';

export default function PublicMenusPage() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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
                        <Link href="/about">About</Link>
                        <Link href="/locations">Locations</Link>
                    </div>
                    <Link href="/admin" className={styles.adminLink}>
                        Admin
                    </Link>
                </div>
            </nav>

            <main className={styles.container}>
                {/* Category Tabs (Sidebar) */}
                <CategoryTabs
                    selected={selectedCategory}
                    onSelect={setSelectedCategory}
                />

                <div className={styles.contentArea}>
                    {/* Top Action Bar */}
                    <MenuActionBar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    {/* Menu List */}
                    <MenuList
                        selectedCategory={selectedCategory}
                        searchQuery={searchQuery}
                    />
                </div>
            </main>

            {/* Simple Footer */}
            <footer className={styles.footer}>
                <p>&copy; 2024 NCafe. All rights reserved.</p>
            </footer>
        </div>
    );
}
