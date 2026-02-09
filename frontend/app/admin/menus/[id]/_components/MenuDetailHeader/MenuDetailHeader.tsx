'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button/Button';
import styles from './MenuDetailHeader.module.css';

interface MenuDetailHeaderProps {
  title: string;
}

export const MenuDetailHeader = ({title}: MenuDetailHeaderProps) => {
  const router = useRouter();

  return (
    <header className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.actions}>
        <Button variant="danger">
          메뉴 삭제
        </Button>
        <Button 
          variant="primary" 
        >
          정보 수정
        </Button>
      </div>
    </header>
  );
  //   return (
  //   <header className={styles.container}>
  //     <h1 className={styles.title}>{title}</h1>
  //     <div className={styles.actions}>
  //       <Button variant="danger" onClick={onDelete}>
  //         메뉴 삭제
  //       </Button>
  //       <Button 
  //         variant="primary" 
  //         onClick={() => router.push(`/admin/menus/${menuId}/edit`)}
  //       >
  //         정보 수정
  //       </Button>
  //     </div>
  //   </header>
  // );
};
