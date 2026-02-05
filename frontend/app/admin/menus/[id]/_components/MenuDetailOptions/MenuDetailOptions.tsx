import React from 'react';
import { MenuOption } from '@/types/menu';
import styles from './MenuDetailOptions.module.css';

interface MenuDetailOptionsProps {
  options: MenuOption[];
}

export const MenuDetailOptions = ({ options }: MenuDetailOptionsProps) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>옵션 정보</h2>
      
      {options.length === 0 ? (
        <p className={styles.empty}>등록된 옵션이 없습니다.</p>
      ) : (
        <div className={styles.grid}>
          {options.map((option) => (
            <div key={option.id} className={styles.optionCard}>
              <div className={styles.optionHeader}>
                <h3 className={styles.optionName}>
                  {option.name}
                  {option.required && <span className={styles.requiredBadge}>필수</span>}
                </h3>
                <span className={styles.optionType}>{option.type === 'radio' ? '단일 선택' : '다중 선택'}</span>
              </div>
              <ul className={styles.itemList}>
                {option.items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>
                      {item.priceDelta > 0 ? `+${item.priceDelta.toLocaleString()}원` : '무료'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
