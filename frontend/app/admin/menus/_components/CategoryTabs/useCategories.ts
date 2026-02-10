import { useState, useEffect } from 'react';
// import { MenuCategory } from '@/types/menu';

export interface CategoryResponseDto {
    id: number;
    name: string;
    icon: string;
    menuCount: number;
}

export interface CategoryListResponseDto {
    categories: CategoryResponseDto[];
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
                const response = await fetch('/api/admin/categories');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    console.error('카테고리 데이터가 배열이 아님:', data);
                    setCategories([]);
                    return;
                }

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
