'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button/Button';
import styles from './MenuDetailActions.module.css';

interface MenuDetailActionsProps {
  menuId: string;
  onDelete: () => void;
}

export const MenuDetailActions = ({ menuId, onDelete }: MenuDetailActionsProps) => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <Button variant="danger" className={styles.deleteButton} onClick={onDelete}>
        메뉴 삭제
      </Button>
      <Button 
        variant="primary" 
        onClick={() => router.push(`/admin/menus/${menuId}/edit`)}
      >
        정보 수정
      </Button>
    </div>
  );
};
