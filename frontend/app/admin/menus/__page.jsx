'use client';

import { useEffect, useState, useMemo } from "react";
import { Menu } from "@/types/menu";
import { MenuList } from './_components/MenuList/MenuList';
import { arrayMove } from '@dnd-kit/sortable';
import { MenuActionBar, ViewMode } from './_components/MenuActionBar/MenuActionBar';
import { CategoryTabs } from './_components/CategoryTabs/CategoryTabs';
// import { categories, menus as initialMenus } from '@/mocks/menuData';
import CategoryList from './_components/CategoryList';
import styles from './page.module.css';

export default function MenusPage() {
    // 1. 상태 관리
    const [menus, setMenus] = useState([]);
    const [category, setCategory] = useState(null);
    // const [viewMode, setViewMode] = useState<ViewMode>('grid');

    console.log('MenusPage');

    useEffect(() => {
        // http://localhost:8080/admin/menus
        const fetchMenus = async () => {

            const url = new URL('/api/admin/menus', window.location.origin);

            const params = url.searchParams;
            if (category) {
                params.set('cid', category);
            }

            const response = await fetch(url);
            const data = await response.json();
            
            // 배열이 아닐때 예외처리
            if (!Array.isArray(data)) {
                console.error("패치데이터가 배열이 아님:", data);
                setMenus([]); // 안전하게 빈 배열로 초기화
                return;
            }
            
            // 정상실행
            setMenus(data);
        };
        fetchMenus();

        return () => {
            console.log('MenusPage useEffect cleanup');
        };
    }, [category]);

    // const [activeCategory, setActiveCategory] = useState(null);

    const handleCategoryChange = (id) => {
        setCategory(id);
    };

    return (
        <main>
            <CategoryList onActiveCategory={handleCategoryChange}/>
            
            <p>선택된 카테고리 ID: {category}</p>

            <section>
                <h1>메뉴블록</h1>
                <div>
                    {menus.map((menu) => (
                        <div key={menu.id}>
                            <h2>{menu.korName}</h2>
                            <p>{menu.engName}</p>
                            <p>{menu.description}</p>
                            <p>{menu.price}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}