'use client';

import { useState, useEffect } from 'react';

export default function CategoryList({ onActiveCategory }) {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/admin/categories');
                const data = await response.json();
                console.log(data);
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    if (categories.length === 0) return null;

    return (
        <section>
            <h1>카테고리블록</h1>
            <div>
                <button onClick={() => onActiveCategory?.(null)}>전체</button>
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onActiveCategory?.(category.id)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </section>
    );
}
