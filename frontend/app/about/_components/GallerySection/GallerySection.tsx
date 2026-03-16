'use client';

import React, { useEffect, useState } from 'react';
import { galleryAPI } from '@/app/lib/api/adminAPI';
import styles from './GallerySection.module.css';

interface GalleryImage {
    id: number;
    imageUrl: string;
    sortOrder: number;
}

const PATTERN = ['m', 'y', 'm', 'y', 'y'];
const PATTERN_ITEMS = Array.from({ length: 1000 }); // 충분한 개수로 정적 렌더링

export default function GallerySection() {
    const [images, setImages] = useState<GalleryImage[]>([]);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const data = await galleryAPI.getPublicImages();
                setImages(data);
            } catch (error) {
                console.error('Failed to fetch gallery images', error);
            }
        };
        fetchImages();
    }, []);

    if (images.length === 0) return null;

    // 이미지를 2개 행으로 나누기
    const half = Math.ceil(images.length / 2);
    const row1 = images.slice(0, half);
    const row2 = images.slice(half);

    // 무한 루프: 4번 반복하여 50% translateX가 원본 2세트를 밀어내도록 함
    const repeat = (arr: GalleryImage[]) => [...arr, ...arr, ...arr, ...arr];

    return (
        <section className={styles.galleryWrapper}>
            {/* Background mymyy Pattern */}
            <div className={styles.patternGrid}>
                {PATTERN_ITEMS.map((_, i) => (
                    <div key={i} className={styles.patternItem}>
                        <span className={styles.patternChar}>{PATTERN[i % PATTERN.length]}</span>
                    </div>
                ))}
            </div>

            <div className={styles.galleryHeader}>
                <span className={styles.subtitle}>OUR MOMENTS</span>
                <h2 className={styles.title}>NCAFE GALLERY</h2>
            </div>

            <div className={styles.scrollContainer}>
                {/* Row 1 */}
                <div className={styles.scrollRow}>
                    <div className={`${styles.scrollTrack} ${styles.trackSlow}`}>
                        {repeat(row1).map((img, idx) => (
                            <div key={`r1-${img.id}-${idx}`} className={styles.imageItem}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/images/${img.imageUrl}`} alt="Gallery" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 2 (약간 다른 속도) */}
                <div className={styles.scrollRow}>
                    <div className={`${styles.scrollTrack} ${styles.trackFast}`}>
                        {repeat(row2).map((img, idx) => (
                            <div key={`r2-${img.id}-${idx}`} className={styles.imageItem}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/images/${img.imageUrl}`} alt="Gallery" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.gradientOverlayLeft}></div>
            <div className={styles.gradientOverlayRight}></div>
        </section>
    );
}
