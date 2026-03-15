'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, List, Grid } from 'lucide-react';
import { MenuActionBar as BaseMenuActionBar } from '@/components/menu/MenuActionBar/MenuActionBar';
import { Button } from '@/components/common';

interface MenuActionBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'grid' | 'list';
    onToggleViewMode: () => void;
}

export const MenuActionBar = ({
    searchQuery,
    onSearchChange,
    viewMode,
    onToggleViewMode,
}: MenuActionBarProps) => {
    return (
        <BaseMenuActionBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
        >
            <Button
                onClick={onToggleViewMode}
                variant="outline"
                leftIcon={viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
            >
                {viewMode === 'grid' ? '리스트' : '그리드'}
            </Button>
            <Link href="/admin/menus/new">
                <Button leftIcon={<Plus size={18} />}>
                    새 메뉴 등록
                </Button>
            </Link>
        </BaseMenuActionBar>
    );
};

export default MenuActionBar;
