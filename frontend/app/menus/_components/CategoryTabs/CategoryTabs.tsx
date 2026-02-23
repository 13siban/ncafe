'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useCategories } from './useCategories';
import styles from './CategoryTabs.module.css';

export default function CategoryTabs(
    { selected, onSelect }: {
        selected: number | null;
        onSelect: (categoryId: number | null) => void;
    }
) {
    const { categories, isLoading, error } = useCategories();

    if (isLoading) {
        return (
            <aside className={styles.tabsContainer}>
                <div className={styles.loadingState}>Loading...</div>
            </aside>
        );
    }

    if (error) {
        return (
            <aside className={styles.tabsContainer}>
                <div className={styles.errorState}>Failed to load categories</div>
            </aside>
        );
    }

    return (
        <aside className={styles.tabsContainer}>
            <div className={styles.header}>
                <h3 className={styles.title}>OUR COFFEE</h3>
                <h1 className={styles.subtitle}>Menu</h1>
            </div>

            <div className={styles.tabsList} role="tablist">
                {/* ALL Tab */}
                <button
                    role="tab"
                    aria-selected={selected === null}
                    className={`${styles.tab} ${selected === null ? styles.tabActive : ''}`}
                    onClick={() => onSelect(null)}
                >
                    <div className={styles.checkbox}>
                        <Check size={16} strokeWidth={3} />
                    </div>
                    <span className={styles.tabText}>ALL</span>
                    <span className={styles.tabCount}>
                        {categories.reduce((acc, cat) => acc + (cat.menuCount || 0), 0)}
                    </span>
                </button>

                {/* Categories */}
                {categories.map((category) => (
                    <button
                        key={category.id}
                        role="tab"
                        aria-selected={selected === category.id}
                        className={`${styles.tab} ${selected === category.id ? styles.tabActive : ''}`}
                        onClick={() => onSelect(category.id)}
                    >
                        <div className={styles.checkbox}>
                            <Check size={16} strokeWidth={3} />
                        </div>
                        <span className={styles.tabText}>{category.name}</span>
                        <span className={styles.tabCount}>{category.menuCount || 0}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}
