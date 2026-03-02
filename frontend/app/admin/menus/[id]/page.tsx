'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from '@/types/menu';
import { MenuDetailInfo } from './_components/MenuDetailInfo/MenuDetailInfo';
import { MenuDetailOptions } from './_components/MenuDetailOptions/MenuDetailOptions';
import { MenuDetailGallery } from './_components/MenuDetailGallery/MenuDetailGallery';
import { MenuDetailHeader } from './_components/MenuDetailHeader/MenuDetailHeader';
import styles from './page.module.css';


export default function MenuDetailPage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = use(params);


  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/admin/menus/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Delete failed');
        alert('메뉴가 삭제되었습니다.');
        router.push('/admin/menus');
      } catch (error) {
        console.error('Delete menu error', error);
        alert('메뉴 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <main className={styles.container}>
      <MenuDetailHeader
        title="메뉴상세"
        menuId={id}
        onDelete={handleDelete}
      />
      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <MenuDetailGallery
            menuID={id}
          />
        </div>
        <div className={styles.rightColumn}>
          <MenuDetailInfo id={id} />
          <MenuDetailOptions />
        </div>
      </div>
    </main>
  );
}
