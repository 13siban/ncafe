'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/app/lib/api/client';
import { MenuForm, MenuFormValues } from '../_components/MenuForm/MenuForm';
import styles from './page.module.css';

export default function NewMenuPage() {
  const router = useRouter();

  const handleCreate = async (data: MenuFormValues) => {
    try {
      const createdMenu = await fetchAPI('/admin/menus', {
        method: 'POST',
        body: JSON.stringify({
          korName: data.korName,
          engName: data.engName || '',
          description: data.description || '',
          price: Number(data.price),
          categoryId: Number(data.categoryId),
          isAvailable: data.status === 'available',
        }),
      });

      if (data.images && data.images.length > 0) {
        const formData = new FormData();
        data.images.forEach((img) => {
          formData.append('files', img);
        });

        await fetchAPI(`/admin/menus/${createdMenu.id}/menu-images`, {
          method: 'POST',
          body: formData,
        });

        alert(`메뉴 [${data.korName}] 등록이 완료되었습니다.`);
      } else {
        alert(`메뉴 [${data.korName}] 등록이 완료되었습니다.`);
      }

      router.push('/admin/menus');
    } catch (error: any) {
      alert(error.message || '메뉴 등록에 실패했습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <MenuForm onSubmit={handleCreate} />
    </div>
  );
}
