import React from 'react';
import { Menu } from '@/types/menu';

import styles from './MenuDetailInfo.module.css';

interface MenuDetailInfoProps {
  menu: Menu;
}

export const MenuDetailInfo = ({ menu }: MenuDetailInfoProps) => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles.category}`}>{menu.category.korName}</span>
            {menu.isSoldOut && <span className={`${styles.badge} ${styles.soldOut}`}>품절</span>}
            {!menu.isAvailable && <span className={`${styles.badge} ${styles.hidden}`}>숨김</span>}
            {menu.isAvailable && !menu.isSoldOut && <span className={`${styles.badge} ${styles.active}`}>판매중</span>}
          </div>
          <h1 className={styles.korName}>{menu.korName}</h1>
          <p className={styles.engName}>{menu.engName}</p>
        </div>
        <div className={styles.price}>
          {menu.price.toLocaleString()}원
        </div>
      </header>
      
      <div className={styles.description}>
        <h3>메뉴 설명</h3>
        <p>{menu.description}</p>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.label}>등록일</span>
          <span className={styles.value}>{menu.createdAt.toLocaleDateString()}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.label}>최종 수정</span>
          <span className={styles.value}>{menu.updatedAt.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
