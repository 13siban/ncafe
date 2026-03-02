'use client';

import React, { useState, useEffect } from 'react';
import { X, GripVertical, Trash2, Plus } from 'lucide-react';
import styles from './CategoryManageModal.module.css';
import { CategoryResponseDto } from '@/components/menu/types';
import { fetchAPI } from '@/app/lib/api';

interface CategoryManageModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: CategoryResponseDto[];
    onSave: () => void;
}

type EditCategory = {
    uid: string;
    id: number | null;
    name: string;
    isDeleted: boolean;
};

export default function CategoryManageModal({ isOpen, onClose, categories, onSave }: CategoryManageModalProps) {
    const [items, setItems] = useState<EditCategory[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setItems(categories.map(c => ({
                uid: String(c.id),
                id: c.id,
                name: c.name,
                isDeleted: false
            })));
        }
    }, [isOpen, categories]);

    if (!isOpen) return null;

    const visibleItems = items.filter(item => !item.isDeleted);

    const handleAdd = () => {
        setItems([
            ...items,
            {
                uid: `new_${Date.now()}`,
                id: null,
                name: '새 카테고리',
                isDeleted: false
            }
        ]);
    };

    const handleDelete = (uid: string) => {
        setItems(items.map(item =>
            item.uid === uid ? { ...item, isDeleted: true } : item
        ));
    };

    const handleNameChange = (uid: string, newName: string) => {
        setItems(items.map(item =>
            item.uid === uid ? { ...item, name: newName } : item
        ));
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const dragIndexStr = e.dataTransfer.getData('text/plain');
        if (!dragIndexStr) return;

        const dragIndex = parseInt(dragIndexStr, 10);
        if (dragIndex === targetIndex) return;

        // items 배열 내에서 visibleItems의 실제 인덱스를 찾아야 함.
        const visibleToRealIndex = (visIndex: number) => {
            let v = -1;
            for (let i = 0; i < items.length; i++) {
                if (!items[i].isDeleted) {
                    v++;
                    if (v === visIndex) return i;
                }
            }
            return -1;
        };

        const realDragIndex = visibleToRealIndex(dragIndex);
        const realDropIndex = visibleToRealIndex(targetIndex);

        if (realDragIndex === -1 || realDropIndex === -1) return;

        const newItems = [...items];
        const draggedItem = newItems.splice(realDragIndex, 1)[0];

        // splice 과정에서 인덱스가 변경될 수 있으므로 다시 계산
        const adjustDropIndex = realDragIndex < realDropIndex ? realDropIndex - 1 : realDropIndex;
        newItems.splice(adjustDropIndex, 0, draggedItem);

        setItems(newItems);
    };

    const handleSaveClick = async () => {
        try {
            setIsSaving(true);
            const promises = [];

            let sortOrderCounter = 1;
            const finalOrdered = items.filter(x => !x.isDeleted);

            // Create & Update
            for (const item of finalOrdered) {
                if (item.id === null) {
                    // Create
                    promises.push(fetchAPI('/admin/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: item.name, sortOrder: sortOrderCounter++ })
                    }));
                } else {
                    // Update
                    promises.push(fetchAPI(`/admin/categories/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: item.name, sortOrder: sortOrderCounter++ })
                    }));
                }
            }

            // Delete
            const deleted = items.filter(x => x.isDeleted && x.id !== null);
            for (const item of deleted) {
                promises.push(fetchAPI(`/admin/categories/${item.id}`, {
                    method: 'DELETE'
                }));
            }

            // 모든 Promise 대기 (하나라도 실패하면 catch로 넘어감)
            const results = await Promise.all(promises);
            for (const res of results) {
                if (!res.ok) {
                    throw new Error('Some API requests failed');
                }
            }

            alert('카테고리 수정이 완료되었습니다.');
            onSave();
        } catch (error) {
            console.error('Failed to save categories', error);
            alert('카테고리 저장 중 오류가 발생했습니다. (메뉴가 포함된 카테고리는 삭제할 수 없습니다)');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>카테고리 관리</h2>
                    <button className={styles.closeButton} onClick={onClose}><X size={20} /></button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.list}>
                        {visibleItems.map((item, index) => (
                            <div
                                key={item.uid}
                                className={styles.listItem}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                <div className={styles.dragHandle}>
                                    <GripVertical size={16} />
                                </div>
                                <input
                                    type="text"
                                    className={styles.nameInput}
                                    value={item.name}
                                    onChange={(e) => handleNameChange(item.uid, e.target.value)}
                                    placeholder="카테고리명"
                                />
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(item.uid)}
                                    title="카테고리 삭제"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button className={styles.addButton} onClick={handleAdd}>
                        <Plus size={16} /> 카테고리 추가하기
                    </button>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
                        취소
                    </button>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSaveClick}
                        disabled={isSaving}
                    >
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
