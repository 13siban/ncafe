'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MenuForm, MenuFormValues } from '../../_components/MenuForm/MenuForm';
import { menus } from '@/mocks/menuData';
import styles from './page.module.css';

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [initialValues, setInitialValues] = useState<Partial<MenuFormValues> | null>(null);

  useEffect(() => {
    // Simulate API fetch delay
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const menu = menus.find(m => m.id === id);
      if (menu) {
        setInitialValues({
          korName: menu.korName,
          engName: menu.engName,
          description: menu.description,
          price: menu.price,
          categoryId: menu.category.id,
          status: menu.isSoldOut ? 'soldout' : (!menu.isAvailable ? 'hidden' : 'available'),
          existingImages: menu.images.map(img => img.url),
          images: [],
          options: menu.options.map(opt => ({
            name: opt.name,
            type: opt.type,
            required: opt.required,
            items: opt.items.map(item => ({
              name: item.name,
              priceDelta: item.priceDelta
            }))
          }))
        });
      } else {
        alert('메뉴를 찾을 수 없습니다.');
        router.push('/admin/menus');
      }
    };
    
    if (id) {
      loadData();
    }
  }, [id, router]);

  const handleUpdate = async (data: MenuFormValues) => {
    console.log("Updating:", data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`메뉴 [${data.korName}] 수정이 완료되었습니다.`);
    router.push(`/admin/menus/${id}`);
  };

  if (!initialValues) {
    return <div className={styles.loading}>메뉴 정보를 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <MenuForm 
        initialValues={initialValues} 
        onSubmit={handleUpdate}
        submitLabel="수정사항 저장"
      />
    </div>
  );
}
