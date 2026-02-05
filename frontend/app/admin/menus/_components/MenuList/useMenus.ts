import { useState, useEffect } from 'react';
import { Menu, MenuCategory } from '@/types/menu';

export interface MenuListRequest {
  categoryId: number | null;
  searchQuery?: string;
}


export interface MenuResponse {
  id: number;
  korName: string;
  engName: string;
  description: string;
  price: number;
  categoryName: string;
  imageSrc: string;
  isAvailable: boolean;
  isSoldOut: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuListResponse {
  menus: MenuResponse[];
  total: number;
}

export const useMenus = ({ categoryId, searchQuery }: MenuListRequest) => {
  const [menus, setMenus] = useState<MenuResponse[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true); //타입스크립트가 기본값보고 추론가능
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);

      const url = new URL('http://localhost:8080/admin/menus');

      const params = url.searchParams;
      if (categoryId !== null) {
        params.set('categoryId', categoryId.toString());
      }
      if (searchQuery) {
        params.set('searchQuery', searchQuery);
      }

      try {
        const menusResponse = await fetch(url.toString());
        
        if (!menusResponse.ok) {
          throw new Error('데이터 로드 중 오류가 발생했습니다.');
        }
        
        const menusData: MenuListResponse = await menusResponse.json();

        if (!menusData || !Array.isArray(menusData.menus)) {
          console.error('메뉴 데이터가 배열이 아님:', menusData);
          setMenus([]);
          return;
        }

        setMenus(menusData.menus);
        setTotal(menusData.total);

        // 카테고리 정보를 맵으로 관리 (빠른 조회를 위해)
        // const categoryMap = new Map<number, MenuCategory>();
        // if (Array.isArray(catsData)) {
        //   catsData.forEach((cat: any) => {
        //     categoryMap.set(Number(cat.id), {
        //       id: Number(cat.id),
        //       korName: cat.name || cat.korName || '',
        //       engName: cat.engName || '',
        //       icon: cat.icon || '',
        //       sortOrder: cat.sortOrder || 0
        //     });
        //   });
        // }

        // // 백엔드 데이터를 프론트엔드 Menu 타입에 맞게 매핑하면서 카테고리 정보 결합
        // const mappedMenus: MenuResponse[] = menusData.map((item: any) => {
        //   const catInfo = categoryMap.get(Number(item.categoryId));
          
        //   return {
        //     id: String(item.id),
        //     korName: item.korName || '',
        //     engName: item.engName || '',
        //     description: item.description || '',
        //     price: item.price || 0,
        //     categoryId: Number(item.categoryId),
        //     category: catInfo || { 
        //       id: Number(item.categoryId), 
        //       korName: `카테고리 ${item.categoryId}`, 
        //       engName: '', 
        //       sortOrder: 0 
        //     },
        //     images: item.images || [],
        //     isAvailable: item.isAvailable ?? true,
        //     isSoldOut: false,
        //     sortOrder: item.sortOrder || 0,
        //     options: item.options || [],
        //     createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        //     updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        //   };
        // });

      } catch (err) {
        console.error('데이터 fetch 실패:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        setMenus([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [categoryId, searchQuery]);

  return { menus, setMenus, total, isLoading, error };
};
