'use client';

import React from 'react';
import { MenuResponse } from '@/components/menu/types';
import { useMenuActions } from './useMenuActions';
import { MenuListView } from './MenuListView';
import { MenuGridView } from './MenuGridView';

interface MenuListProps {
    selectedCategory: number | null;
    searchQuery: string;
    viewMode: 'grid' | 'list';
}

export const MenuList = ({
    selectedCategory,
    searchQuery,
    viewMode,
}: MenuListProps) => {
    const [menus, setMenus] = React.useState<MenuResponse[] | undefined>(undefined);

    const {
        handleAvailableToggle,
        handleSoldOutToggle,
        handleDelete,
        handleReorder,
        handleInlineChange,
        handleBatchSave,
    } = useMenuActions(menus, setMenus);

    if (viewMode === 'list') {
        return (
            <MenuListView
                menus={menus}
                setMenus={setMenus}
                searchQuery={searchQuery}
                handleAvailableToggle={handleAvailableToggle}
                handleSoldOutToggle={handleSoldOutToggle}
                handleInlineChange={handleInlineChange}
                handleBatchSave={handleBatchSave}
                handleReorder={handleReorder}
            />
        );
    }

    return (
        <MenuGridView
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            menus={menus}
            setMenus={setMenus}
            handleAvailableToggle={handleAvailableToggle}
            handleDelete={handleDelete}
            handleReorder={handleReorder}
        />
    );
};

export default MenuList;
