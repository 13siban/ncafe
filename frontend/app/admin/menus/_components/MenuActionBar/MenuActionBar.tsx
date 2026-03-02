'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { MenuActionBar as BaseMenuActionBar } from '@/components/menu/MenuActionBar/MenuActionBar';
import { Button } from '@/components/common';

interface MenuActionBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const MenuActionBar = ({
    searchQuery,
    onSearchChange,
}: MenuActionBarProps) => {
    return (
        <BaseMenuActionBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
        >
            <Link href="/admin/menus/new">
                <Button leftIcon={<Plus size={18} />}>
                    새 메뉴 등록
                </Button>
            </Link>
        </BaseMenuActionBar>
    );
};

export default MenuActionBar;
