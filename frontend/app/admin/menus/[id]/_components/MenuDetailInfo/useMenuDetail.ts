import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api/client';

export interface MenuDetailResponse {
  id: number;
  korName: string;
  engName: string;
  description: string;
  price: number;
  categoryName: string;
  isAvailable: boolean;
  isOrderable: boolean;
  isSoldOut: boolean;
  images?: Array<{
    id: number;
    srcUrl: string;
    sortOrder: number;
    altText?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const useMenuDetail = (id: number) => {
  const [menu, setMenu] = useState<MenuDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data: MenuDetailResponse = await fetchAPI(`/admin/menus/${id}`);
      setMenu(data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return {
    menu,
    isLoading,
    error,
    refresh: fetchMenu
  };
};
