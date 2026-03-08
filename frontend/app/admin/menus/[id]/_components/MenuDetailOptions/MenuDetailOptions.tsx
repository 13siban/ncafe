'use client';

import React, { useEffect, useState } from 'react';
import { OptionGroup } from '@/types/menuOption';
import styles from './MenuDetailOptions.module.css';

interface MenuDetailOptionsProps {
  menuId: number;
}

export const MenuDetailOptions = ({ menuId }: MenuDetailOptionsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mappedGroups, setMappedGroups] = useState<OptionGroup[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        // Fetch menu details to get categoryId
        const menuRes = await fetch(`/api/admin/menus/${menuId}`);
        if (!menuRes.ok) return;
        const menuData = await menuRes.json();
        const categoryId = menuData.categoryId; // Check backend DTO for `categoryId`

        if (categoryId) {
          // Fetch category options (all possible groups for this menu)
          const catOptionsRes = await fetch(`/api/admin/categories/${categoryId}/options`);
          if (catOptionsRes.ok) {
            const groups = await catOptionsRes.json();
            setMappedGroups(groups);
          }
        }

        // Fetch exclusions for this menu
        const exRes = await fetch(`/api/admin/menus/${menuId}/option-exclusions`);
        if (exRes.ok) {
          const excludedGroups: any[] = await exRes.json();
          // backend can return number[] directly or object[]. Make sure we have number[]
          const numericIds = excludedGroups.map(id => typeof id === 'object' ? Number(id.id) : Number(id));
          setExcludedIds(numericIds);
        }
      } catch (error) {
        console.error("Failed to fetch option exclusions", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (menuId) {
      fetchMenuData();
    }
  }, [menuId]);

  const toggleExclusion = async (groupId: number, isExcluded: boolean) => {
    try {
      if (isExcluded) {
        // If it's already excluded, we want to REMOVE the exclusion (so it's included again)
        const res = await fetch(`/api/admin/menus/${menuId}/option-exclusions/${groupId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setExcludedIds(prev => prev.filter(id => id !== groupId));
        }
      } else {
        // If it's not excluded, we want to ADD the exclusion
        const res = await fetch(`/api/admin/menus/${menuId}/option-exclusions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionGroupId: groupId })
        });
        if (res.ok) {
          setExcludedIds(prev => [...prev, groupId]);
        }
      }
    } catch (error) {
      console.error("Failed to toggle option exclusion", error);
      alert("옵션 설정 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return <div className={styles.container}>옵션 데이터를 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>사용 메뉴 옵션 설정</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          이 메뉴가 속한 카테고리에서 상속받은 전체 옵션 그룹입니다.<br />
          현재 메뉴에서 화면에 노출하고 <strong>사용할 옵션은 체크</strong>하고, 사용하지 않을 옵션은 <strong>체크 해제</strong>하여 숨김 처리할 수 있습니다.
        </p>
      </div>

      {mappedGroups.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p className={styles.empty}>이 카테고리에 등록된 기본 옵션이 없습니다.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {mappedGroups.map((group) => {
            const isExcluded = excludedIds.includes(group.id);
            const isUsed = !isExcluded; // 사용 중인 경우 체크됨

            return (
              <div key={group.id} className={`${styles.optionCard} ${isExcluded ? styles.optionExcluded : ''}`}>
                <div className={styles.optionHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={isUsed}
                      onChange={() => toggleExclusion(group.id, isExcluded)}
                      style={{ cursor: 'pointer', width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                      id={`group-ex-${group.id}`}
                    />
                    <label htmlFor={`group-ex-${group.id}`} className={styles.optionName} style={{ cursor: 'pointer', margin: 0, opacity: isExcluded ? 0.5 : 1 }}>
                      {group.name}
                      {group.isRequired && <span className={styles.requiredBadge}>필수</span>}
                    </label>
                  </div>
                  <span className={styles.optionType}>
                    {group.type === 'radio' ? '단일 선택' : '다중 선택'}
                  </span>
                </div>
                <ul className={styles.itemList} style={{ opacity: isExcluded ? 0.5 : 1, pointerEvents: isExcluded ? 'none' : 'auto' }}>
                  {group.items?.map((item) => (
                    <li key={item.id} className={styles.item}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemPrice}>
                        {item.priceDelta > 0 ? `+${new Intl.NumberFormat('ko-KR').format(item.priceDelta)}원` : '무료'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
