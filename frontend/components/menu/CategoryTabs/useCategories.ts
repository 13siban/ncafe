'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api';
import { CategoryResponseDto, MenuMode } from '../types';

interface UseCategoriesOptions {
    mode?: MenuMode;
}

export const useCategories = ({ mode = 'public' }: UseCategoriesOptions = {}) => {
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const endpoint = mode === 'admin'
            ? '/admin/categories'
            : '/categories';

        try {
            const data = await fetchAPI(endpoint);

            if (!Array.isArray(data)) {
                setCategories([]);
                return;
            }

            data.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
            setCategories(data);
        } catch (err) {
            console.error('카테고리 데이터 fetch 실패:', err);
            setError(err instanceof Error ? err.message : '카테고리를 불러오는데 실패했습니다.');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, [mode]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { categories, isLoading, error, refetch };
};
