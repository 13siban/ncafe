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
      }

      // 옵션 그룹 생성 및 카테고리 연결
      if (data.options && data.options.length > 0) {
        for (let i = 0; i < data.options.length; i++) {
          const opt = data.options[i];
          if (!opt.name.trim()) continue;

          // 1. 옵션 그룹 생성
          const groupRes = await fetch('/api/admin/option-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: opt.name,
              type: opt.type,
              isRequired: opt.required,
              sortOrder: i + 1,
            }),
          });

          if (groupRes.ok) {
            const savedGroup = await groupRes.json();

            // 2. 옵션 항목(아이템) 추가
            for (let j = 0; j < opt.items.length; j++) {
              const item = opt.items[j];
              if (!item.name.trim()) continue;
              await fetch(`/api/admin/option-groups/${savedGroup.id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: item.name,
                  priceDelta: Number(item.priceDelta) || 0,
                  sortOrder: j + 1,
                }),
              });
            }

            // 3. 해당 카테고리에 옵션 그룹 연결
            await fetch(`/api/admin/categories/${Number(data.categoryId)}/options`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                optionGroupId: savedGroup.id,
                sortOrder: i + 1,
              }),
            });
          }
        }
      }

      alert(`메뉴 [${data.korName}] 등록이 완료되었습니다.`);
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
