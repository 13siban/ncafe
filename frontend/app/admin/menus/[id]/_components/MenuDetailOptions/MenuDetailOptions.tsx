import React from 'react';
import { MenuOption } from '@/types/menu';
import styles from './MenuDetailOptions.module.css';

interface MenuDetailOptionsProps {
  options: MenuOption[];
}

export const MenuDetailOptions = () => {
  // Dummy data for preview
  const options: MenuOption[] = [
    {
      id: '1',
      name: '온도 선택',
      type: 'radio',
      required: true,
      items: [
        { id: '1-1', name: 'HOT', priceDelta: 0 },
        { id: '1-2', name: 'ICE', priceDelta: 500 },
      ]
    },
    {
      id: '2',
      name: '사이즈 업',
      type: 'checkbox',
      required: false,
      items: [
        { id: '2-1', name: '그란데 사이즈', priceDelta: 500 },
        { id: '2-2', name: '벤티 사이즈', priceDelta: 1000 },
      ]
    },
    {
      id: '3',
      name: '샷/시럽 추가',
      type: 'checkbox',
      required: false,
      items: [
        { id: '3-1', name: '에스프레소 샷 추가', priceDelta: 500 },
        { id: '3-2', name: '바닐라 시럽 추가', priceDelta: 500 },
        { id: '3-3', name: '헤이즐넛 시럽 추가', priceDelta: 500 },
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>옵션 정보</h2>
      
      {options.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p className={styles.empty}>등록된 옵션이 없습니다.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {options.map((option) => (
            <div key={option.id} className={styles.optionCard}>
              <div className={styles.optionHeader}>
                <h3 className={styles.optionName}>
                  {option.name}
                  {option.required && <span className={styles.requiredBadge}>필수</span>}
                </h3>
                <span className={styles.optionType}>
                  {option.type === 'radio' ? '단일 선택' : '다중 선택'}
                </span>
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

