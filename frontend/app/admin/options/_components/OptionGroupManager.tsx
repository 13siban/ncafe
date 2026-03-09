'use client';

import React from 'react';
import { Plus, Link as LinkIcon, ChevronDown, ChevronRight } from 'lucide-react';
import styles from './OptionGroupManager.module.css';

import { useOptionGroups } from './OptionGroupManager/useOptionGroups';
import { OptionGroupCard } from './OptionGroupManager/_components/OptionGroupCard/OptionGroupCard';
import { GroupFormModal } from './OptionGroupManager/_components/GroupFormModal/GroupFormModal';
import { ItemFormModal } from './OptionGroupManager/_components/ItemFormModal/ItemFormModal';
import { LinkGroupModal } from './OptionGroupManager/_components/LinkGroupModal/LinkGroupModal';

export const OptionGroupManager = () => {
    const {
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
    } = useOptionGroups();

    // Computation
    const getUnlinkedOptions = () => {
        const linkedIds = new Set<number>();
        Object.values(categoryOptions).forEach(groups => {
            groups.forEach(g => linkedIds.add(g.id));
        });
        return allOptions.filter(o => !linkedIds.has(o.id));
    };

    const unlinkedOptions = getUnlinkedOptions();

    if (isLoading) return <div className={styles.loading}>데이터를 불러오는 중...</div>;

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
                                    {ops.map(group => (
                                        <OptionGroupCard
                                            key={`${cat.id}-${group.id}`}
                                            group={group}
                                            catId={cat.id}
                                            openGroupModal={openGroupModal}
                                            unlinkGroup={unlinkGroup}
                                            deleteGroup={deleteGroup}
                                            openItemModal={openItemModal}
                                            deleteItem={deleteItem}
                                        />
                                    ))}
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
                                {unlinkedOptions.map(group => (
                                    <OptionGroupCard
                                        key={`unlinked-${group.id}`}
                                        group={group}
                                        catId={null}
                                        openGroupModal={openGroupModal}
                                        unlinkGroup={unlinkGroup}
                                        deleteGroup={deleteGroup}
                                        openItemModal={openItemModal}
                                        deleteItem={deleteItem}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {modalMode === 'group' && (
                <GroupFormModal
                    isEdit={isEdit}
                    targetCategoryId={targetCategoryId}
                    form={groupForm}
                    setForm={setGroupForm}
                    onClose={closeModal}
                    onSave={saveGroup}
                />
            )}

            {modalMode === 'item' && (
                <ItemFormModal
                    isEdit={isEdit}
                    form={itemForm}
                    setForm={setItemForm}
                    onClose={closeModal}
                    onSave={saveItem}
                />
            )}

            {modalMode === 'link' && (
                <LinkGroupModal
                    allOptions={allOptions}
                    categoryOptions={categoryOptions}
                    targetCategoryId={targetCategoryId}
                    onClose={closeModal}
                    onLink={linkExistingGroup}
                />
            )}
        </div>
    );
};
