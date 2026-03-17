'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { MenuList as BaseMenuList } from '@/components/menu/MenuList/MenuList';
import { MenuCard } from '../MenuCard/MenuCard';
import { Button } from '@/components/common';
import { MenuResponse } from '@/components/menu/types';

interface MenuGridViewProps {
    selectedCategory: number | null;
    searchQuery: string;
    menus: MenuResponse[] | undefined;
    setMenus: React.Dispatch<React.SetStateAction<MenuResponse[] | undefined>>;
    handleAvailableToggle: (menuId: number, isAvailable: boolean) => void;
    handleDelete: (menuId: number) => void;
    handleReorder: (reorderedMenus: MenuResponse[], previousMenus?: MenuResponse[]) => void;
}

export const MenuGridView = ({
    selectedCategory,
    searchQuery,
    menus,
    setMenus,
    handleAvailableToggle,
    handleDelete,
    handleReorder,
}: MenuGridViewProps) => {
    return (
        <BaseMenuList
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            mode="admin"
            menus={menus}
            setMenus={setMenus}
            onMenusChange={setMenus}
            sortable={true}
            onReorder={handleReorder}
            renderCard={(menu, dragHandleProps) => (
                <MenuCard
                    menu={menu}
                    onAvailableToggle={handleAvailableToggle}
                    onDelete={handleDelete}
                    dragHandleProps={dragHandleProps}
                />
            )}
            emptyAction={
                <Link href="/admin/menus/new">
                    <Button leftIcon={<Plus size={18} />}>새 메뉴 등록</Button>
                </Link>
            }
            errorAction={
                <Button onClick={() => window.location.reload()}>다시 시도</Button>
            }
        />
    );
};
