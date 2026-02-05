'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from '@/types/menu';
import { menus as MOCK_MENUS } from '@/mocks/menuData';
import { MenuDetailInfo } from './_components/MenuDetailInfo/MenuDetailInfo';
import { MenuDetailOptions } from './_components/MenuDetailOptions/MenuDetailOptions';
import { MenuDetailGallery } from './_components/MenuDetailGallery/MenuDetailGallery';
import { MenuDetailActions } from './_components/MenuDetailActions/MenuDetailActions';
import styles from './page.module.css';

export default function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [menu, setMenu] = useState<Menu | null>(null);

  useEffect(() => {
    // Simulate fetch
    const foundMenu = MOCK_MENUS.find(m => m.id === id);
    setMenu(foundMenu || null);
  }, [id]);

  const handleDelete = () => {
    if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
      alert('메뉴가 삭제되었습니다.');
      router.push('/admin/menus');
    }
  };

  if (!menu) {
    return (
      <div className={styles.loading}>
        <p>메뉴 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <MenuDetailGallery images={menu.images} korName={menu.korName} />
        </div>
        <div className={styles.rightColumn}>
          <MenuDetailInfo menu={menu} />
          <MenuDetailOptions options={menu.options} />
          <MenuDetailActions menuId={menu.id} onDelete={handleDelete} />
        </div>
      </div>
    </main>
  );
}
