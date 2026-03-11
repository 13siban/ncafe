'use client';

import React, { useState } from 'react';
import { Check, Settings } from 'lucide-react';
import { useCategories } from './useCategories';
import { CategoryManageModal } from './CategoryManageModal';
import { MenuMode } from '../types';
import styles from './CategoryTabs.module.css';

interface CategoryTabsProps {
    selected: number | null;
    onSelect: (categoryId: number | null) => void;
    mode?: MenuMode;
}

export default function CategoryTabs({
    selected,
    onSelect,
    mode = 'public',
}: CategoryTabsProps) {
    const { categories, isLoading, error, refetch } = useCategories({ mode });
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

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
        <>
            <aside className={styles.tabsContainer}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>OUR COFFEE</h3>
                        <h1 className={styles.subtitle}>Menu</h1>
                    </div>
                    {mode === 'admin' && (
                        <button
                            className={styles.manageButton}
                            onClick={() => setIsManageModalOpen(true)}
                            title="카테고리 관리"
                        >
                            <Settings size={20} />
                        </button>
                    )}
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
                    {categories.map((category) => {
                        if (category.name === '---') {
                            return <div key={category.id} className={styles.divider} />;
                        }

                        return (
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
                        );
                    })}
                </div>

            </aside>

            {
                mode === 'admin' && (
                    <CategoryManageModal
                        isOpen={isManageModalOpen}
                        onClose={() => setIsManageModalOpen(false)}
                        categories={categories}
                        refetch={refetch}
                        onSave={() => {
                            setIsManageModalOpen(false);
                            refetch();
                        }}
                    />
                )
            }
        </>
    );
}

export { CategoryTabs };
