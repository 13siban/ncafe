'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MenuForm, MenuFormValues } from '../_components/MenuForm/MenuForm';
import styles from './page.module.css';

export default function NewMenuPage() {
  const router = useRouter();

  const handleCreate = async (data: MenuFormValues) => {
    console.log("Creating:", data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`메뉴 [${data.korName}] 등록이 완료되었습니다.`);
    router.push('/admin/menus');
  };

  return (
    <div className={styles.container}>
      <MenuForm onSubmit={handleCreate} />
    </div>
  );
}
