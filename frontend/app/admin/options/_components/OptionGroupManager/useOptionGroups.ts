'use client';

import { useState, useEffect } from 'react';
import { Category, OptionGroup, OptionItem, GroupFormData, ItemFormData } from './types';

export function useOptionGroups() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<Record<number, OptionGroup[]>>({});
    const [allOptions, setAllOptions] = useState<OptionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<number[]>([]);

    const [modalMode, setModalMode] = useState<'group' | 'item' | 'link' | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [targetCategoryId, setTargetCategoryId] = useState<number | null>(null);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);

    const [groupForm, setGroupForm] = useState<GroupFormData>({ name: '', type: 'radio', isRequired: false, sortOrder: 1 });
    const [itemForm, setItemForm] = useState<ItemFormData>({ name: '', priceDelta: 0, sortOrder: 1 });

    const fetchData = async (showLoading: boolean = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const [catsRes, allOpsRes] = await Promise.all([
                fetch('/api/admin/categories'),
                fetch('/api/admin/option-groups')
            ]);

            let catsTemp: Category[] = [];
            if (catsRes.ok) {
                const data = await catsRes.json();
                if (Array.isArray(data)) {
                    catsTemp = data
                        .filter((cat: Category) => !cat.name.includes('---'))
                        .sort((a, b) => a.sortOrder - b.sortOrder);
                }
            }
            setCategories(catsTemp);

            let opsTemp: OptionGroup[] = [];
            if (allOpsRes.ok) {
                const data = await allOpsRes.json();
                if (Array.isArray(data)) opsTemp = data;
            }
            setAllOptions(opsTemp);

            const opsMap: Record<number, OptionGroup[]> = {};
            for (const cat of catsTemp) {
                const res = await fetch(`/api/admin/categories/${cat.id}/options`);
                if (res.ok) {
                    const mapped = await res.json();
                    if (Array.isArray(mapped)) opsMap[cat.id] = mapped;
                    else opsMap[cat.id] = [];
                }
            }
            setCategoryOptions(opsMap);

            if (catsTemp.length > 0 && expandedSections.length === 0) {
                setExpandedSections([catsTemp[0].id]);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, []);

    const toggleSection = (id: number) => {
        setExpandedSections(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingGroupId(null);
        setEditingItemId(null);
        setTargetCategoryId(null);
    };

    const openGroupModal = (group?: OptionGroup, categoryId: number | null = null) => {
        setTargetCategoryId(categoryId);
        if (group) {
            setIsEdit(true);
            setEditingGroupId(group.id);
            setGroupForm({ name: group.name, type: group.type, isRequired: group.isRequired, sortOrder: group.sortOrder || 1 });
        } else {
            setIsEdit(false);
            setEditingGroupId(null);
            let nextSortOrder = 1;
            if (categoryId && categoryOptions[categoryId]) {
                nextSortOrder = categoryOptions[categoryId].length + 1;
            } else {
                nextSortOrder = allOptions.length + 1;
            }
            setGroupForm({ name: '', type: 'radio', isRequired: false, sortOrder: nextSortOrder });
        }
        setModalMode('group');
    };

    const openLinkModal = (categoryId: number) => {
        setTargetCategoryId(categoryId);
        setModalMode('link');
    };

    const openItemModal = (groupId: number, item?: OptionItem) => {
        setEditingGroupId(groupId);
        if (item) {
            setIsEdit(true);
            setEditingItemId(item.id);
            setItemForm({ name: item.name, priceDelta: item.priceDelta || 0, sortOrder: item.sortOrder || 1 });
        } else {
            setIsEdit(false);
            setEditingItemId(null);
            const group = allOptions.find(g => g.id === groupId);
            const nextOrder = group && group.items ? group.items.length + 1 : 1;
            setItemForm({ name: '', priceDelta: 0, sortOrder: nextOrder });
        }
        setModalMode('item');
    };

    const saveGroup = async () => {
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/api/admin/option-groups/${editingGroupId}` : '/api/admin/option-groups';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(groupForm)
            });

            if (res.ok) {
                const savedGroup = await res.json();
                if (!isEdit && targetCategoryId) {
                    await fetch(`/api/admin/categories/${targetCategoryId}/options`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            optionGroupId: savedGroup.id,
                            sortOrder: groupForm.sortOrder
                        })
                    });
                }
                await fetchData();
                closeModal();
            } else {
                alert('옵션 그룹 저장 실패');
            }
        } catch (e) { console.error(e); }
    };

    const deleteGroup = async (id: number) => {
        if (!confirm('정말로 이 옵션 그룹을 삭제하시겠습니까? (연결된 모든 카테고리에서 사라집니다)')) return;
        try {
            const res = await fetch(`/api/admin/option-groups/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
            else alert('삭제 실패');
        } catch (e) { console.error(e); }
    };

    const linkExistingGroup = async (groupId: number, groupName: string) => {
        if (!targetCategoryId) return;
        const category = categories.find(c => c.id === targetCategoryId);
        const categoryName = category ? category.name : '해당';
        if (!confirm(`${categoryName} 카테고리에 [${groupName}] 옵션을 추가하시겠습니까?`)) return;

        try {
            const nextSortOrder = categoryOptions[targetCategoryId]?.length + 1 || 1;
            const res = await fetch(`/api/admin/categories/${targetCategoryId}/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ optionGroupId: groupId, sortOrder: nextSortOrder })
            });
            if (res.ok) {
                alert(`${categoryName} 카테고리에 [${groupName}] 옵션이 추가 되었습니다.`);
                fetchData();
                closeModal();
            } else {
                const errorText = await res.text();
                alert(`연결 실패: ${errorText}`);
            }
        } catch (e) { console.error(e); }
    };

    const unlinkGroup = async (categoryId: number, groupId: number, groupName: string) => {
        if (!confirm(`[${groupName}] 옵션을 이 카테고리에서 지우시겠습니까? (이 카테고리에서만 해제됩니다)`)) return;
        try {
            const res = await fetch(`/api/admin/categories/${categoryId}/options/${groupId}`, { method: 'DELETE' });
            if (res.ok) {
                alert('해당 카테고리에서 옵션이 해제되었습니다.');
                fetchData();
            } else alert('해제 실패');
        } catch (e) { console.error(e); }
    };

    const saveItem = async () => {
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit
            ? `/api/admin/option-groups/${editingGroupId}/items/${editingItemId}`
            : `/api/admin/option-groups/${editingGroupId}/items`;
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemForm)
            });
            if (res.ok) {
                await fetchData();
                closeModal();
            } else {
                alert('옵션 항목 저장 실패');
            }
        } catch (e) { console.error(e); }
    };

    const deleteItem = async (groupId: number, itemId: number) => {
        if (!confirm('항목을 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/admin/option-groups/${groupId}/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) fetchData();
            else alert('삭제 실패');
        } catch (e) { console.error(e); }
    };

    return {
        categories,
        categoryOptions,
        allOptions,
        isLoading,
        expandedSections,
        modalMode,
        isEdit,
        targetCategoryId,
        groupForm,
        itemForm,
        setGroupForm,
        setItemForm,
        toggleSection,
        openGroupModal,
        openLinkModal,
        openItemModal,
        closeModal,
        saveGroup,
        deleteGroup,
        linkExistingGroup,
        unlinkGroup,
        saveItem,
        deleteItem
    };
}
