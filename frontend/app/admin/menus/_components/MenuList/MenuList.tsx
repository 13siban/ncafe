'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { fetchAPI } from '@/app/lib/api';
import { MenuList as BaseMenuList } from '@/components/menu/MenuList/MenuList';
import { MenuCard } from '../MenuCard/MenuCard';
import { Button } from '@/components/common';
import { MenuResponse } from '@/components/menu/types';

interface MenuListProps {
    selectedCategory: number | null;
    searchQuery: string;
}

export const MenuList = ({
    selectedCategory,
    searchQuery,
}: MenuListProps) => {
    const [menus, setMenus] = React.useState<MenuResponse[] | undefined>(undefined);

    const handleAvailableToggle = async (menuId: number, isAvailable: boolean) => {
        const targetMenu = menus?.find((m) => m.id === menuId);
        if (!targetMenu) return;

        try {
            await fetchAPI(`/admin/menus/${menuId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...targetMenu,
                    isAvailable: isAvailable,
                }),
            });

            setMenus((prev) =>
                prev?.map((menu) =>
                    menu.id === menuId ? { ...menu, isAvailable: isAvailable, isOrderable: isAvailable && !menu.isSoldOut } : menu
                )
            );
        } catch (error) {
            console.error('Failed to toggle availability', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    const handleDelete = async (menuId: number) => {
        try {
            await fetchAPI(`/admin/menus/${menuId}`, {
                method: 'DELETE',
            });
            alert('메뉴가 삭제되었습니다.');
            setMenus((prev) => prev?.filter((menu) => menu.id !== menuId));
            window.location.reload(); // Refresh the entire list
        } catch (error) {
            console.error('Failed to delete menu', error);
            alert('메뉴 삭제에 실패했습니다.');
        }
    };

    return (
        <BaseMenuList
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            mode="admin"
            menus={menus}
            setMenus={setMenus}
            onMenusChange={setMenus}
            renderCard={(menu) => (
                <MenuCard
                    menu={menu}
                    onAvailableToggle={handleAvailableToggle}
                    onDelete={handleDelete}
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

export default MenuList;
