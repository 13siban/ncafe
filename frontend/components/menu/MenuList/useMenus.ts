'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/app/lib/api';
import { MenuResponse, MenuListResponse, MenuMode } from '../types';

export interface UseMenusOptions {
    categoryId: number | null;
    searchQuery?: string;
    mode?: MenuMode;
}

export const useMenus = ({ categoryId, searchQuery, mode = 'public' }: UseMenusOptions) => {
    const [menus, setMenus] = useState<MenuResponse[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMenus = async () => {
            setIsLoading(true);
            setError(null);

            const endpoint = mode === 'admin' ? '/admin/menus' : '/menus';
            const params = new URLSearchParams();

            if (categoryId !== null) {
                params.set('categoryId', categoryId.toString());
            }
            if (searchQuery) {
                params.set('searchQuery', searchQuery);
            }
            if (mode === 'public') {
                params.set('onlyAvailable', 'true');
            }

            try {
                const queryString = params.toString() ? `?${params.toString()}` : '';
                const data: MenuListResponse = await fetchAPI(endpoint + queryString);

                if (!data || !Array.isArray(data.menus)) {
                    console.error('메뉴 데이터가 배열이 아님:', data);
                    setMenus([]);
                    return;
                }

                setMenus(data.menus);
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
    }, [categoryId, searchQuery, mode]);

    return { menus, setMenus, total, isLoading, error };
};
