
"use client";
import { useEffect } from "react";
import { Menu } from "@/types";
import { useState } from "react";
import CategoryList from "./_components/CategoryList";
export default function MenusPage() {
    // fetch menus
    const [menus, setMenus] = useState([]);
    const [category, setCategory] = useState(null);
    console.log("MenusPage");
    useEffect(() => {
        // http://localhost:8080/admin/menus
        const fetchMenus = async () => {
            const url = new URL("http://localhost:8080/admin/menus");
            const params = url.searchParams;
            if (category) {
                params.set("cid", category.id);
            }
            const response = await fetch(url);
            const data = await response.json();
            // menus = data;
            setMenus(data);
        };
        fetchMenus(); // 여기서 fatch 하는 것이 올바른 곳일까요?
        console.log("MenusPage useEffect");
        return () => {
            console.log("MenusPage useEffect cleanup");
        };
    }, [category]);

    const categoryChangeHandler = (category) => {
        console.log(category);
        setCategory(category);
    };
    return (
        <main>
            {/*
                카테고리 블록
                메뉴 목록 
            */}
            <CategoryList x={1} onCategoryChange={categoryChangeHandler} />
            <section>
                <h1>메뉴 목록</h1>
                <div>
                    {menus.map((menu) => (
                        <div key={menu.id}>
                            <h2>{menu.name}</h2>
                            <p>{menu.description}</p>
                            <p>{menu.price}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}