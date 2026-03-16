'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, GripHorizontal, Save } from 'lucide-react';
import { fetchAPI } from '@/app/lib/api';
import { MenuList as BaseMenuList } from '@/components/menu/MenuList/MenuList';
import { MenuCard } from '../MenuCard/MenuCard';
import { Button } from '@/components/common';
import { MenuResponse } from '@/components/menu/types';
import styles from './MenuList.module.css';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MenuListProps {
    selectedCategory: number | null;
    searchQuery: string;
    viewMode: 'grid' | 'list';
}

// 리스트뷰 DnD용 SortableRow
function SortableRow({ id, children }: { id: number; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={styles.listRow}>
            <div className={styles.listDragHandle} {...attributes} {...listeners}>
                <GripHorizontal size={16} />
            </div>
            {children}
        </div>
    );
}

export const MenuList = ({
    selectedCategory,
    searchQuery,
    viewMode,
}: MenuListProps) => {
    const [menus, setMenus] = React.useState<MenuResponse[] | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // 리스트 뷰용 DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

    const handleSoldOutToggle = async (menuId: number, isSoldOut: boolean) => {
        const targetMenu = menus?.find((m) => m.id === menuId);
        if (!targetMenu) return;
        try {
            await fetchAPI(`/admin/menus/${menuId}`, {
                method: 'PUT',
                body: JSON.stringify({ ...targetMenu, isSoldOut }),
            });
            setMenus((prev) =>
                prev?.map((menu) =>
                    menu.id === menuId ? { ...menu, isSoldOut, isOrderable: menu.isAvailable && !isSoldOut } : menu
                )
            );
        } catch (error) {
            console.error('Failed to toggle sold out', error);
            alert('품절 상태 변경에 실패했습니다.');
        }
    };

    const handleDelete = async (menuId: number) => {
        try {
            await fetchAPI(`/admin/menus/${menuId}`, {
                method: 'DELETE',
            });
            alert('메뉴가 삭제되었습니다.');
            setMenus((prev) => prev?.filter((menu) => menu.id !== menuId));
        } catch (error) {
            console.error('Failed to delete menu', error);
            alert('메뉴 삭제에 실패했습니다.');
        }
    };

    const handleReorder = async (reorderedMenus: MenuResponse[]) => {
        try {
            await fetchAPI('/admin/menus/reorder', {
                method: 'PUT',
                body: JSON.stringify(reorderedMenus.map(m => ({
                    menuId: m.id,
                    sortOrder: m.sortOrder,
                }))),
            });
        } catch (e) {
            console.error('Reorder failed', e);
        }
    };

    // 리스트 뷰: 인라인 편집
    const handleInlineChange = (menuId: number, field: string, value: any) => {
        setMenus((prev) =>
            prev?.map((m) =>
                m.id === menuId ? { ...m, [field]: value, _modified: true } : m
            )
        );
    };

    const handleBatchSave = async () => {
        if (!menus) return;
        const modified = menus.filter((m: any) => m._modified);
        if (modified.length === 0) return;

        setIsSaving(true);
        try {
            await Promise.all(
                modified.map((m) =>
                    fetchAPI(`/admin/menus/${m.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(m),
                    })
                )
            );
            setMenus((prev) =>
                prev?.map((m) => ({ ...m, _modified: false } as any))
            );
            alert('변경사항이 저장되었습니다.');
        } catch (e) {
            alert('저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    // 리스트 뷰 DnD
    const handleListDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !menus || active.id === over.id) return;

        const oldIndex = menus.findIndex(m => m.id === active.id);
        const newIndex = menus.findIndex(m => m.id === over.id);
        const reordered = arrayMove(menus, oldIndex, newIndex).map((m, i) => ({
            ...m,
            sortOrder: i + 1,
        }));

        setMenus(reordered as any);
        handleReorder(reordered);
    };

    const filtered = menus?.filter(m => m.korName.includes(searchQuery)) || [];

    // 리스트 뷰 렌더
    if (viewMode === 'list') {
        return (
            <div className={styles.listContainer}>
                {menus?.some((m: any) => m._modified) && (
                    <div className={styles.batchSaveBar}>
                        <Button onClick={handleBatchSave} isLoading={isSaving} variant="primary" leftIcon={<Save size={16} />}>
                            변경사항 저장
                        </Button>
                    </div>
                )}
                {isMounted ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleListDragEnd}>
                        <SortableContext items={filtered.map(f => f.id)} strategy={verticalListSortingStrategy}>
                            <div className={styles.listTable}>
                                <div className={styles.listHeader}>
                                <div className={styles.listColGrip}></div>
                                <div className={styles.listColName}>메뉴명</div>
                                <div className={styles.listColPrice}>가격</div>
                                <div className={styles.listColToggle}>표시</div>
                                <div className={styles.listColToggle}>품절</div>
                            </div>
                            {filtered.map((menu: any) => (
                                <SortableRow key={menu.id} id={menu.id}>
                                    <div className={`${styles.listColName} ${menu._modified ? styles.modified : ''}`}>
                                        <input
                                            className={styles.inlineInput}
                                            value={menu.korName}
                                            onChange={e => handleInlineChange(menu.id, 'korName', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.listColPrice}>
                                        <input
                                            type="number"
                                            className={styles.inlineInput}
                                            value={menu.price}
                                            onChange={e => handleInlineChange(menu.id, 'price', parseInt(e.target.value))}
                                            style={{ width: '80px' }}
                                        />
                                    </div>
                                    <div className={styles.listColToggle}>
                                        <input
                                            type="checkbox"
                                            checked={menu.isAvailable !== false}
                                            onChange={e => handleAvailableToggle(menu.id, e.target.checked)}
                                        />
                                    </div>
                                    <div className={styles.listColToggle}>
                                        <input
                                            type="checkbox"
                                            checked={menu.isSoldOut}
                                            onChange={e => handleSoldOutToggle(menu.id, e.target.checked)}
                                        />
                                    </div>
                                </SortableRow>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                ) : (
                    <div className={styles.listTable}>
                        <div className={styles.listHeader}>
                            <div className={styles.listColGrip}></div>
                            <div className={styles.listColName}>메뉴명</div>
                            <div className={styles.listColPrice}>가격</div>
                            <div className={styles.listColToggle}>표시</div>
                            <div className={styles.listColToggle}>품절</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 그리드 뷰: BaseMenuList 사용
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

export default MenuList;
