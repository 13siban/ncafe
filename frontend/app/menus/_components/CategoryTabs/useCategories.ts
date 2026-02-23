import { useState, useEffect } from 'react';

export interface CategoryResponseDto {
    id: number;
    name: string;
    menuCount?: number;
}

export const useCategories = () => {
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/categories');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
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
    }, []);

    return { categories, isLoading, error };
};
