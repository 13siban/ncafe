'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/app/lib/api';
import { CategoryResponseDto, MenuMode } from '../types';

interface UseCategoriesOptions {
    mode?: MenuMode;
}

export const useCategories = ({ mode = 'public' }: UseCategoriesOptions = {}) => {
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            setError(null);

            const endpoint = mode === 'admin'
                ? '/admin/categories'
                : '/categories';

            try {
                // fetchAPI adds /api and handles parsing
                const data = await fetchAPI(endpoint);

                if (!Array.isArray(data)) {
                    console.error('카테고리 데이터가 배열이 아님:', data);
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
        };

        fetchCategories();
    }, [mode]);

    return { categories, isLoading, error };
};
