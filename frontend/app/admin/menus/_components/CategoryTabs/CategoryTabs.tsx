'use client';

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { CategoryTabs as BaseCategoryTabs } from '@/components/menu/CategoryTabs/CategoryTabs';
import { CategoryManageModal } from './CategoryManageModal';
import styles from '@/components/menu/CategoryTabs/CategoryTabs.module.css';

interface AdminCategoryTabsProps {
    selected: number | null;
    onSelect: (categoryId: number | null) => void;
}

export const CategoryTabs = ({ selected, onSelect }: AdminCategoryTabsProps) => {
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    return (
        <BaseCategoryTabs
            selected={selected}
            onSelect={onSelect}
            mode="admin"
            renderHeaderAction={(categories, refetch) => (
                <>
                    <button
                        className={styles.manageButton}
                        onClick={() => setIsManageModalOpen(true)}
                        title="카테고리 관리"
                    >
                        <Settings size={20} />
                    </button>
                    {isManageModalOpen && (
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
                    )}
                </>
            )}
        />
    );
};

export default CategoryTabs;
