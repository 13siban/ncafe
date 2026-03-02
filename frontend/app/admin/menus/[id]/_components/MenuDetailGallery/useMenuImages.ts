import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api';

export interface MenuImageResponse {
  id: number;
  menuId: number;
  srcUrl: string;
  sortOrder: number;
  altText?: string;
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
      // fetchAPI handles the /api prefix and res.json() parsing internally
      const data: MenuImageListResponse = await fetchAPI(`/menus/${menuId}/menu-images`);
      setImages(data.images || []);
      setKorName(data.korName || '');
    } catch (err) {
      console.error('Failed to fetch menu images:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [menuId]);

  const setPrimaryImage = async (imageId: number) => {
    try {
      await fetchAPI(`/admin/menus/${menuId}/menu-images/${imageId}/set-primary`, {
        method: 'PUT'
      });
      await fetchImages(); // 갱신
    } catch (err) {
      console.error('대표 이미지 설정 실패:', err);
      alert('대표 이미지 설정에 실패했습니다.');
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!confirm('정말 이 이미지를 삭제하시겠습니까?')) return;
    try {
      await fetchAPI(`/admin/menus/${menuId}/menu-images/${imageId}`, {
        method: 'DELETE'
      });
      await fetchImages(); // 갱신
    } catch (err) {
      console.error('이미지 삭제 실패:', err);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  const uploadImages = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      await fetchAPI(`/admin/menus/${menuId}/menu-images`, {
        method: 'POST',
        // fetchAPI needs to not alter Content-Type when body is FormData so browser can set boundary automatically
        // If fetchAPI forces application/json, we might need a workaround. Assuming fetchAPI handles FormData naturally.
        body: formData,
      });
      await fetchImages(); // 갱신
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    korName,
    isLoading,
    error,
    refresh: fetchImages,
    setPrimaryImage,
    deleteImage,
    uploadImages
  };
};
