'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api';
import { CategoryResponseDto } from '@/components/menu/types';

export const useAdminCategories = () => {
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchAPI('/admin/categories');

            if (!Array.isArray(data)) {
                setCategories([]);
                return;
            }

            // sort by sortOrder
            data.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

            setCategories(data);
        } catch (err) {
            console.error('카테고리 데이터 fetch 실패:', err);
            setError(err instanceof Error ? err.message : '카테고리를 불러오는데 실패했습니다.');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, isLoading, error, refetch: fetchCategories };
};
