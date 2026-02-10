import { useState, useEffect, useCallback } from 'react';

export interface MenuImageResponse {
  id: number;
  menuId: number;
  srcUrl: string;
  createdAt: string;
  sortOrder: number;
  altText: string;
}

export interface MenuImageListResponse {
  korName: string;
  images: MenuImageResponse[];
}

export const useMenuImages = (menuId: number) => {
  const [images, setImages] = useState<MenuImageResponse[]>([]);
  const [korName, setKorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!menuId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/menus/${menuId}/menu-images`);
      if (!response.ok) {
        throw new Error('메뉴 이미지를 불러오는데 실패했습니다.');
      }
      
      const data: MenuImageListResponse = await response.json();
      setImages(data.images || []);
      setKorName(data.korName || '');
    } catch (err) {
      console.error('Failed to fetch menu images:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [menuId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    korName,
    isLoading,
    error,
    refresh: fetchImages
  };
};
