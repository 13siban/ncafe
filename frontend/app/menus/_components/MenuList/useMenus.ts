import { useState, useEffect } from 'react';

export interface MenuListRequest {
    categoryId: number | null;
    searchQuery?: string;
    onlyAvailable?: boolean;
}

export interface MenuResponse {
    id: number;
    korName: string;
    engName: string;
    description: string;
    price: number;
    categoryName: string;
    imageSrc: string;
    isOrderable: boolean;
    isSoldOut: boolean;
    sortOrder: number;
}

export interface MenuListResponse {
    menus: MenuResponse[];
    total: number;
}

export const useMenus = ({ categoryId, searchQuery, onlyAvailable = true }: MenuListRequest) => {
    const [menus, setMenus] = useState<MenuResponse[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMenus = async () => {
            setIsLoading(true);
            setError(null);

            const url = new URL('/api/menus', window.location.origin);
            const params = url.searchParams;

            if (categoryId !== null) {
                params.set('categoryId', categoryId.toString());
            }
            if (searchQuery) {
                params.set('searchQuery', searchQuery);
            }
            if (onlyAvailable) {
                params.set('onlyAvailable', 'true');
            }

            try {
                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error('데이터 로드 중 오류가 발생했습니다.');
                }

                const data: MenuListResponse = await response.json();
                setMenus(data.menus || []);
                setTotal(data.total || 0);
            } catch (err) {
                console.error('데이터 fetch 실패:', err);
                setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
                setMenus([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMenus();
    }, [categoryId, searchQuery, onlyAvailable]);

    return { menus, total, isLoading, error };
};
