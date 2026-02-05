'use client';

import React from 'react';
import { useState } from 'react';
import { useCategories } from './useCategories';
import styles from './CategoryTabs.module.css';


export default function CategoryTabs(
  { selected, onSelect } : { 
    selected: number | null;
    onSelect: (categoryId: number | null) => void;
  }

) {
  console.log('[CategoryTabs] Props로 받은 selectedCategory:', selected);

  const { categories, isLoading, error } = useCategories();
  // const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  // let [selectCategory, setSelectCategory] = useState<number | null>(null);


  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.tabsContainer}>
        <div className={styles.loadingState}>카테고리 로딩 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.tabsContainer}>
        <div className={styles.errorState}>카테고리 로딩 실패</div>
      </div>
    );
  }



  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsList} role="tablist">
        {/* 전체 탭 */}
        <button
          role="tab"
          aria-selected={selected === null}
          className={`${styles.tab} ${selected === null ? styles.tabActive : ''}`}
          onClick={() => onSelect(null)}
        >
          <span>전체</span>
        </button>

        {/* 카테고리 탭들 */}
        {categories.map((category) => (
          <button
            key={category.id}
            role="tab"
            aria-selected={selected === category.id}
            className={`${styles.tab} ${selected === category.id ? styles.tabActive : ''}`}
            onClick={() => onSelect(category.id)}
          >
            {category.icon && <span className={styles.tabIcon}>{category.icon}</span>}
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


