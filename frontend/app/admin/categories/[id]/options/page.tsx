'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import styles from './page.module.css';
import { OptionGroup } from '@/types/menuOption';

export default function CategoryOptionsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const categoryId = parseInt(id, 10);
    const router = useRouter();

    const [allGroups, setAllGroups] = useState<OptionGroup[]>([]);
    const [mappedGroupIds, setMappedGroupIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all groups
                const allRes = await fetch('/api/admin/option-groups');
                if (allRes.ok) {
                    const allData = await allRes.json();
                    setAllGroups(allData);
                }

                // Fetch mapped groups for this category
                const mapRes = await fetch(`/api/admin/categories/${categoryId}/options`);
                if (mapRes.ok) {
                    const mappedData: OptionGroup[] = await mapRes.json();
                    setMappedGroupIds(mappedData.map(g => g.id));
                }
            } catch (error) {
                console.error('Failed to fetch category options', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (categoryId) {
            fetchData();
        }
    }, [categoryId]);

    const handleToggle = async (groupId: number, isCurrentlyMapped: boolean) => {
        try {
            if (isCurrentlyMapped) {
                // Remove map
                const res = await fetch(`/api/admin/categories/${categoryId}/options/${groupId}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setMappedGroupIds(prev => prev.filter(id => id !== groupId));
                }
            } else {
                // Add map
                const sortOrder = mappedGroupIds.length + 1; // simple sort order
                const res = await fetch(`/api/admin/categories/${categoryId}/options`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ optionGroupId: groupId, sortOrder })
                });
                if (res.ok) {
                    setMappedGroupIds(prev => [...prev, groupId]);
                }
            }
        } catch (error) {
            console.error('Toggle error', error);
            alert('설정 변경에 실패했습니다.');
        }
    };

    if (isLoading) return <div className={styles.container}>로딩 중...</div>;

    return (
        <main className={styles.container}>
            <button className={styles.backBtn} onClick={() => router.push('/admin/menus')}>
                <ChevronLeft size={20} /> 메뉴 관리로 돌아가기
            </button>
            <div className={styles.header} style={{ marginTop: '1.5rem' }}>
                <h1 className={styles.title}>카테고리 옵션 설정</h1>
            </div>

            <p className={styles.info}>
                이 카테고리에 속하는 모든 메뉴가 아래 선택된 옵션 그룹을 <strong>자동으로 상속</strong>받습니다.<br />
                특정 메뉴에서 예외 처리(제외)가 필요한 경우, 해당 메뉴 상세 페이지에서 개별 설정할 수 있습니다.
            </p>

            <div className={styles.list}>
                {allGroups.map(group => {
                    const isMapped = mappedGroupIds.includes(group.id);
                    return (
                        <div key={group.id} className={`${styles.item} ${isMapped ? styles.itemChecked : ''}`}>
                            <div className={styles.itemLeft}>
                                <input
                                    type="checkbox"
                                    className={styles.itemCheckbox}
                                    checked={isMapped}
                                    onChange={() => handleToggle(group.id, isMapped)}
                                />
                                <div className={styles.itemInfo}>
                                    <h3>
                                        {group.name}
                                        {group.isRequired && <span className={`${styles.badge} ${styles.badgeRequired}`}>필수</span>}
                                        <span className={`${styles.badge} ${styles.badgeRadio}`}>
                                            {group.type === 'radio' ? '단일선택' : '다중선택'}
                                        </span>
                                    </h3>
                                    <p>포함된 항목: {group.items?.map(i => i.name).join(', ') || '없음'}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {allGroups.length === 0 && (
                    <p>등록된 옵션 그룹이 없습니다. '옵션 관리' 메뉴에서 옵션을 먼저 생성해주세요.</p>
                )}
            </div>
        </main>
    );
}
