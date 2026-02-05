import React, { useState } from 'react';
import Image from 'next/image';
import { MenuImage } from '@/types/menu';
import styles from './MenuDetailGallery.module.css';

interface MenuDetailGalleryProps {
  images: MenuImage[];
  korName: string;
}

export const MenuDetailGallery = ({ images, korName }: MenuDetailGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<MenuImage | null>(
    images.find(img => img.isPrimary) || images[0] || null
  );

  if (!selectedImage) {
    return (
      <div className={styles.emptyContainer}>
        <span className={styles.emptyText}>이미지가 없습니다.</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainImageWrapper}>
         <Image 
            src={selectedImage.url} 
            alt={korName} 
            fill
            className={styles.mainImage}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
         />
         {selectedImage.isPrimary && <span className={styles.primaryBadge}>대표</span>}
      </div>
      
      {images.length > 1 && (
        <div className={styles.thumbnailList}>
          {images.map((img) => (
            <button 
              key={img.id} 
              className={`${styles.thumbnailButton} ${selectedImage.id === img.id ? styles.active : ''}`}
              onClick={() => setSelectedImage(img)}
            >
              <Image 
                src={img.url} 
                alt={`${korName} thumbnail`} 
                width={80} 
                height={80} 
                className={styles.thumbnailImage}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
