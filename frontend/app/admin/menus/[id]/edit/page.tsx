'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAPI } from '@/app/lib/api';
import { MenuForm, MenuFormValues } from '../../_components/MenuForm/MenuForm';
import { menus } from '@/mocks/menuData';
import styles from './page.module.css';

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [initialValues, setInitialValues] = useState<Partial<MenuFormValues> | null>(null);
  const [originalImages, setOriginalImages] = useState<{ id: number, url: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const menu = await fetchAPI(`/admin/menus/${id}`);
        let existingImgData: { id: number, url: string }[] = [];
        
        try {
          const imageRes = await fetchAPI(`/menus/${id}/menu-images`);
          const getImageUrl = (srcUrl: string) => {
            if (!srcUrl) return '';
            if (srcUrl.startsWith('http')) return srcUrl;
            return `/api/upload/${srcUrl}`;
          };
          existingImgData = (imageRes.images || []).map((img: any) => ({
            id: img.id,
            url: getImageUrl(img.srcUrl)
          }));
          setOriginalImages(existingImgData);
        } catch (imgErr) {
          console.error('Failed to load menu images', imgErr);
        }

        setInitialValues({
          korName: menu.korName,
          engName: menu.engName,
          description: menu.description,
          price: menu.price,
          categoryId: menu.categoryId, // ensure using the correct field mapping here
          status: menu.isSoldOut ? 'soldout' : (!menu.isAvailable ? 'hidden' : 'available'),
          existingImages: existingImgData.map(img => img.url),
          images: [],
          options: [] // not implementing options yet over API
        });
      } catch (error) {
        console.error('Failed to load menu data', error);
        alert('메뉴를 찾을 수 없습니다.');
        router.push('/admin/menus');
      }
    };

    if (id) {
      loadData();
    }
  }, [id, router]);

  const handleUpdate = async (data: MenuFormValues) => {
    try {
      await fetchAPI(`/admin/menus/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          korName: data.korName,
          engName: data.engName || '',
          description: data.description || '',
          price: Number(data.price),
          categoryId: Number(data.categoryId),
          isAvailable: data.status === 'available',
        }),
      });

      // Handle deleted existing images
      const keptUrls = new Set(data.existingImages || []);
      const deletedImages = originalImages.filter(img => !keptUrls.has(img.url));
      
      for (const img of deletedImages) {
        await fetchAPI(`/admin/menus/${id}/menu-images/${img.id}`, { method: 'DELETE' })
          .catch(console.error);
      }

      // Handle new uploaded images
      if (data.images && data.images.length > 0) {
        const formData = new FormData();
        data.images.forEach((img: File) => {
          formData.append('files', img);
        });

        await fetchAPI(`/admin/menus/${id}/menu-images`, {
          method: 'POST',
          body: formData,
        });
      }

      alert(`메뉴 [${data.korName}] 수정이 완료되었습니다.`);
      router.push(`/admin/menus`);
    } catch (error: any) {
      alert(error.message || '메뉴 수정에 실패했습니다.');
    }
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
