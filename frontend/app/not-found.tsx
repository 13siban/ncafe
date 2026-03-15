'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './not-found.module.css';

const PATTERN = ['m', 'y', 'm', 'y', 'y'];

function MagneticBackground() {
    const gridRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ rows: 0, cols: 0 });

    useEffect(() => {
        const updateGrid = () => {
             setDimensions({
                 cols: Math.ceil((window.innerWidth + 100) / 60),
                 rows: Math.ceil((window.innerHeight + 100) / 60)
             });
        };
        updateGrid();
        window.addEventListener('resize', updateGrid);
        // Fallback for initial render issues with innerWidth
        window.dispatchEvent(new Event('resize'));
        return () => window.removeEventListener('resize', updateGrid);
    }, []);

    useEffect(() => {
        if (!gridRef.current || dimensions.rows === 0) return;
        
        let timeout: ReturnType<typeof setTimeout>;
        let itemData: { item: HTMLElement; cx: number; cy: number }[] = [];

        timeout = setTimeout(() => {
            if (!gridRef.current) return;
            const items = Array.from(gridRef.current.children) as HTMLElement[];
            itemData = items.map(item => {
                const rect = item.getBoundingClientRect();
                return {
                    item,
                    cx: rect.left + rect.width / 2,
                    cy: rect.top + rect.height / 2
                };
            });
        }, 100);

        const handleMouseMove = (e: MouseEvent) => {
             const mx = e.clientX;
             const my = e.clientY;
             requestAnimationFrame(() => {
                 itemData.forEach(({ item, cx, cy }) => {
                     const dx = mx - cx;
                     const dy = my - cy;
                     // Add 90 degrees offset to point towards the cursor
                     const deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                     item.style.transform = `rotate(${deg}deg)`;
                 });
             });
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
             clearTimeout(timeout);
             window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [dimensions]);

    const itemsCount = dimensions.rows * dimensions.cols;

    return (
        <div className={styles.gridContainer} ref={gridRef}>
           {Array.from({ length: itemsCount }).map((_, i) => (
               <div key={i} className={styles.filingItem}>
                   <span className={styles.charSpan}>{PATTERN[i % PATTERN.length]}</span>
               </div>
           ))}
        </div>
    );
}

export default function NotFound() {
    return (
        <div id="not-found-page" className={styles.container}>
            <MagneticBackground />
            <div className={styles.content}>
                <h1 className={styles.title}>404 페이지를 찾을 수 없습니다</h1>
                <Link href="/" className={styles.homeBtn}>
                    홈페이지 이동
                </Link>
            </div>
        </div>
    );
}
