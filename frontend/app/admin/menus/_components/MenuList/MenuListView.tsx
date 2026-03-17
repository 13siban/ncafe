'use client';

import React, { useState } from 'react';
import { GripHorizontal, Save } from 'lucide-react';
import { Button } from '@/components/common';
import { MenuResponse } from '@/components/menu/types';
import styles from './MenuListView.module.css';

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

interface MenuListViewProps {
    menus: MenuResponse[] | undefined;
    setMenus: React.Dispatch<React.SetStateAction<MenuResponse[] | undefined>>;
    searchQuery: string;
    handleAvailableToggle: (menuId: number, isAvailable: boolean) => void;
    handleSoldOutToggle: (menuId: number, isSoldOut: boolean) => void;
    handleInlineChange: (menuId: number, field: string, value: any) => void;
    handleBatchSave: () => Promise<void>;
    handleReorder: (reorderedMenus: MenuResponse[], previousMenus?: MenuResponse[]) => void;
}

export const MenuListView = ({
    menus,
    setMenus,
    searchQuery,
    handleAvailableToggle,
    handleSoldOutToggle,
    handleInlineChange,
    handleBatchSave,
    handleReorder,
}: MenuListViewProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleListDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !menus || active.id === over.id) return;

        const previousMenus = [...menus];
        const oldIndex = menus.findIndex(m => m.id === active.id);
        const newIndex = menus.findIndex(m => m.id === over.id);
        const reordered = arrayMove(menus, oldIndex, newIndex).map((m, i) => ({
            ...m,
            sortOrder: i + 1,
        }));

        setMenus(reordered as any);
        handleReorder(reordered, previousMenus);
    };

    const onBatchSave = async () => {
        setIsSaving(true);
        try {
            await handleBatchSave();
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = menus?.filter(m => m.korName.includes(searchQuery)) || [];

    const listHeader = (
        <div className={styles.listHeader}>
            <div className={styles.listColGrip}></div>
            <div className={styles.listColName}>메뉴명</div>
            <div className={styles.listColPrice}>가격</div>
            <div className={styles.listColToggle}>표시</div>
            <div className={styles.listColToggle}>품절</div>
        </div>
    );

    return (
        <div className={styles.listContainer}>
            {menus?.some((m: any) => m._modified) && (
                <div className={styles.batchSaveBar}>
                    <Button onClick={onBatchSave} isLoading={isSaving} variant="primary" leftIcon={<Save size={16} />}>
                        변경사항 저장
                    </Button>
                </div>
            )}
            {isMounted ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleListDragEnd}>
                    <SortableContext items={filtered.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className={styles.listTable}>
                            {listHeader}
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
                    {listHeader}
                </div>
            )}
        </div>
    );
};
