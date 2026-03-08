'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Link as LinkIcon, Unlink, ChevronDown, ChevronRight } from 'lucide-react';
import { OptionGroup, OptionItem } from '@/types/menuOption';
import styles from './OptionGroupManager.module.css';

interface Category {
    id: number;
    name: string;
    sortOrder: number;
}

export const OptionGroupManager = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<Record<number, OptionGroup[]>>({});
    const [allOptions, setAllOptions] = useState<OptionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [expandedSections, setExpandedSections] = useState<number[]>([]); // store category IDs. special ID -1 for unlinked.

    // Modals
    const [modalMode, setModalMode] = useState<'group' | 'item' | 'link' | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    // Target state for operations
    const [targetCategoryId, setTargetCategoryId] = useState<number | null>(null);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);

    // Forms
    const [groupForm, setGroupForm] = useState({ name: '', type: 'radio', isRequired: false, sortOrder: 1 });
    const [itemForm, setItemForm] = useState({ name: '', priceDelta: 0, sortOrder: 1 });

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
                    catsTemp = data.sort((a, b) => a.sortOrder - b.sortOrder);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleSection = (id: number) => {
        setExpandedSections(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Computations
    const getUnlinkedOptions = () => {
        const linkedIds = new Set<number>();
        Object.values(categoryOptions).forEach(groups => {
            groups.forEach(g => linkedIds.add(g.id));
        });
        return allOptions.filter(o => !linkedIds.has(o.id));
    };

    const unlinkedOptions = getUnlinkedOptions();

    // Modal Actions
    const openGroupModal = (group?: OptionGroup, categoryId: number | null = null) => {
        setTargetCategoryId(categoryId);
        if (group) {
            setIsEdit(true);
            setEditingGroupId(group.id);
            setGroupForm({ name: group.name, type: group.type, isRequired: group.isRequired, sortOrder: group.sortOrder || 1 });
        } else {
            setIsEdit(false);
            setEditingGroupId(null);

            // Generate sortOrder
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

    const closeModal = () => {
        setModalMode(null);
        setEditingGroupId(null);
        setEditingItemId(null);
        setTargetCategoryId(null);
    };

    // API Actions
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

                // If creating and a target category is specified, link them!
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
        } catch (e) {
            console.error(e);
        }
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
                console.error('Link error:', errorText);
            }
        } catch (e) {
            alert('서버 오류 발생');
            console.error(e);
        }
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


    const renderGroupCard = (group: OptionGroup, catId: number | null) => (
        <div key={`${catId}-${group.id}`} className={styles.groupCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h3 className={styles.groupName}>{group.name}</h3>
                    <div className={styles.badges}>
                        <span className={`${styles.badge} ${group.type === 'radio' ? styles.badgeRadio : styles.badgeCheckbox}`}>
                            {group.type === 'radio' ? '단일선택' : '다중선택'}
                        </span>
                        {group.isRequired && (
                            <span className={`${styles.badge} ${styles.badgeRequired}`}>필수</span>
                        )}
                    </div>
                </div>
                <div className={styles.cardActions}>
                    <button className={styles.iconButton} onClick={() => openGroupModal(group, catId)} title="옵션 수정">
                        <Edit2 size={16} />
                    </button>
                    {catId !== null ? (
                        <button className={`${styles.iconButton} ${styles.deleteIcon}`} onClick={() => unlinkGroup(catId, group.id, group.name)} title={`카테고리에서 [${group.name}] 해제`}>
                            <Trash2 size={16} />
                        </button>
                    ) : (
                        <button className={`${styles.iconButton} ${styles.deleteIcon}`} onClick={() => deleteGroup(group.id)} title="옵션 완전 삭제">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                    <h4>항목 ({group.items?.length || 0})</h4>
                    <button className={styles.actionButton} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openItemModal(group.id)}>
                        <Plus size={12} /> 추가
                    </button>
                </div>
                {group.items && group.items.length > 0 ? (
                    <ul className={styles.itemList}>
                        {[...group.items].sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
                            <li key={item.id} className={styles.item}>
                                <div>
                                    <span className={styles.itemName}>{item.name} </span>
                                    {item.priceDelta > 0 && <span className={styles.itemPrice}>(+{item.priceDelta}원)</span>}
                                </div>
                                <div className={styles.itemControls}>
                                    <button className={styles.iconButton} onClick={() => openItemModal(group.id, item)} style={{ padding: '0.2rem' }}>
                                        <Edit2 size={12} />
                                    </button>
                                    <button className={`${styles.iconButton} ${styles.deleteIcon}`} onClick={() => deleteItem(group.id, item.id)} style={{ padding: '0.2rem' }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>항목이 없습니다.</p>
                )}
            </div>
        </div>
    );

    if (isLoading) return <div>데이터를 불러오는 중...</div>;

    return (
        <div className={styles.container}>
            {/* 1. Category Sections */}
            {categories.map(cat => {
                const isOpen = expandedSections.includes(cat.id);
                const ops = categoryOptions[cat.id] || [];

                return (
                    <div key={cat.id} className={styles.section}>
                        <div
                            className={`${styles.sectionHeader} ${isOpen ? styles.sectionHeaderOpen : ''}`}
                            onClick={() => toggleSection(cat.id)}
                        >
                            <h2 className={styles.sectionTitle}>
                                {cat.name}
                                <span className={styles.sectionCount}>{ops.length}</span>
                            </h2>
                            {isOpen ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                        </div>

                        {isOpen && (
                            <div className={styles.sectionContent}>
                                <div className={styles.grid}>
                                    {ops.map(group => renderGroupCard(group, cat.id))}
                                    <div className={styles.addCard}>
                                        <button className={styles.addCardBtn} onClick={() => openGroupModal(undefined, cat.id)}>
                                            <Plus size={20} />
                                            <span>이 카테고리에 새 옵션 만들기</span>
                                        </button>
                                        <button className={styles.addCardBtn} onClick={() => openLinkModal(cat.id)}>
                                            <LinkIcon size={20} />
                                            <span>기존 옵션 불러오기</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 2. Unlinked Section */}
            {unlinkedOptions.length > 0 && (
                <div className={styles.section}>
                    <div
                        className={`${styles.sectionHeader} ${expandedSections.includes(-1) ? styles.sectionHeaderOpen : ''}`}
                        onClick={() => toggleSection(-1)}
                    >
                        <h2 className={styles.sectionTitle} style={{ color: 'var(--text-secondary)' }}>
                            연결되지 않은 옵션 그룹 (미사용)
                            <span className={styles.sectionCount} style={{ background: 'var(--text-secondary)' }}>{unlinkedOptions.length}</span>
                        </h2>
                        {expandedSections.includes(-1) ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                    </div>
                    {expandedSections.includes(-1) && (
                        <div className={styles.sectionContent}>
                            <div className={styles.grid} style={{ marginBottom: 0 }}>
                                {unlinkedOptions.map(group => renderGroupCard(group, null))}
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* Modals Data Below */}

            {modalMode && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>
                                {modalMode === 'group' ? (isEdit ? '옵션 그룹 수정' : '새 옵션 그룹 만들기') :
                                    modalMode === 'item' ? (isEdit ? '항목 수정' : '항목 추가') :
                                        '기존 옵션 그룹 불러오기'}
                            </h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {modalMode === 'group' && (
                            <form onSubmit={(e) => { e.preventDefault(); saveGroup(); }}>
                                {targetCategoryId !== null && !isEdit && (
                                    <p className={styles.modalDesc}>새로 생성된 옵션은 현재 선택된 카테고리에 자동으로 연결됩니다.</p>
                                )}
                                <div className={styles.formGroup}>
                                    <label>그룹 이름</label>
                                    <input required value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="예: 온도 선택" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>입력 타입</label>
                                    <select value={groupForm.type} onChange={e => setGroupForm({ ...groupForm, type: e.target.value })}>
                                        <option value="radio">Radio (단일 선택)</option>
                                        <option value="checkbox">Checkbox (다중 선택)</option>
                                    </select>
                                </div>
                                <div className={`${styles.formGroup} ${styles.formGroupCheckbox}`}>
                                    <input type="checkbox" id="req" checked={groupForm.isRequired} onChange={e => setGroupForm({ ...groupForm, isRequired: e.target.checked })} />
                                    <label htmlFor="req" style={{ margin: 0, fontWeight: 'normal' }}>필수 옵션으로 지정</label>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>표시 순서</label>
                                    <input type="number" value={groupForm.sortOrder} onChange={e => setGroupForm({ ...groupForm, sortOrder: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div className={styles.modalActions}>
                                    <button type="button" className={styles.btnCancel} onClick={closeModal}>취소</button>
                                    <button type="submit" className={styles.btnSubmit}>저장</button>
                                </div>
                            </form>
                        )}

                        {modalMode === 'item' && (
                            <form onSubmit={(e) => { e.preventDefault(); saveItem(); }}>
                                <div className={styles.formGroup}>
                                    <label>선택 항목 이름</label>
                                    <input required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="예: HOT" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>추가 금액 (원)</label>
                                    <input type="number" step="100" value={itemForm.priceDelta} onChange={e => setItemForm({ ...itemForm, priceDelta: parseInt(e.target.value) || 0 })} />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>추가 비용이 없으면 0으로 입력하세요.</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>표시 순서</label>
                                    <input type="number" value={itemForm.sortOrder} onChange={e => setItemForm({ ...itemForm, sortOrder: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div className={styles.modalActions}>
                                    <button type="button" className={styles.btnCancel} onClick={closeModal}>취소</button>
                                    <button type="submit" className={styles.btnSubmit}>저장</button>
                                </div>
                            </form>
                        )}

                        {modalMode === 'link' && (
                            <div>
                                <p className={styles.modalDesc}>다른 카테고리에서 이미 사용 중인 옵션을 이 카테고리에 복사해서 적용합니다. 항목과 가격은 공유됩니다.</p>

                                {allOptions.length === 0 ? (
                                    <div className={styles.emptyState}>등록된 기존 옵션이 없습니다.</div>
                                ) : (
                                    <div className={styles.linkList}>
                                        {allOptions.filter(opt => {
                                            // exclude options already in this category
                                            const existing = categoryOptions[targetCategoryId!] || [];
                                            return !existing.some(e => e.id === opt.id);
                                        }).map(opt => (
                                            <div
                                                key={opt.id}
                                                className={styles.linkListItem}
                                            >
                                                <div className={styles.linkItemContent}>
                                                    <span className={styles.linkItemName}>{opt.name}</span>
                                                    <span className={styles.linkItemMeta}>
                                                        {opt.type === 'radio' ? '단일선택' : '다중선택'} · 항목 {opt.items?.length || 0}개
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={styles.addBtnText}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        linkExistingGroup(opt.id, opt.name);
                                                    }}
                                                >
                                                    <Plus size={14} /> 추가
                                                </button>
                                            </div>
                                        ))}
                                        {/* Handle case where all options are already linked */}
                                        {allOptions.filter(opt => {
                                            const existing = categoryOptions[targetCategoryId!] || [];
                                            return !existing.some(e => e.id === opt.id);
                                        }).length === 0 && (
                                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                    모든 옵션이 이미 연결되어 있습니다.
                                                </div>
                                            )}
                                    </div>
                                )}

                                <div className={styles.modalActions}>
                                    <button type="button" className={styles.btnCancel} onClick={closeModal}>닫기</button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};
