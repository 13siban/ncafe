import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './MenuDetailGallery.module.css';
import { useMenuImages } from './useMenuImages';

interface MenuDetailGalleryProps {
  menuID: number;
}

export const MenuDetailGallery = ({ menuID }: MenuDetailGalleryProps) => {
  const { images, korName, isLoading, error } = useMenuImages(menuID);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  // 이미지 목록이 로드되면 첫 번째 이미지를 선택
  useEffect(() => {
    if (images.length > 0 && selectedImageId === null) {
      setSelectedImageId(images[0].id);
    }
  }, [images, selectedImageId]);

  if (isLoading) return <div className={styles.emptyContainer}>로딩 중...</div>;
  if (error) return <div className={styles.emptyContainer}>{error}</div>;

  const selectedImage = images.find(img => img.id === selectedImageId) || images[0];

  if (!selectedImage) {
    return (
      <div className={styles.emptyContainer}>
        <span className={styles.emptyText}>이미지가 없습니다.</span>
      </div>
    );
  }

  // 백엔드 서버 주소를 포함한 전체 이미지 URL 반환
  const getImageUrl = (srcUrl: string) => {
    if (!srcUrl) return '';
    if (srcUrl.startsWith('http')) return srcUrl;
    return `http://localhost:8080/${srcUrl}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainImageWrapper}>
         <Image 
            src={getImageUrl(selectedImage.srcUrl)} 
            alt={selectedImage.altText || "메뉴 이미지"} 
            fill
            className={styles.mainImage}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
         />
         {selectedImage.sortOrder === 1 && <span className={styles.primaryBadge}>대표</span>}
      </div>
      
      {images.length > 1 && (
        <div className={styles.thumbnailList}>
          {images.map((img) => (
            <button 
              key={img.id} 
              className={`${styles.thumbnailButton} ${selectedImage.id === img.id ? styles.active : ''}`}
              onClick={() => setSelectedImageId(img.id)}
            >
              <Image 
                src={getImageUrl(img.srcUrl)} 
                alt={img.altText || "썸네일"} 
                width={80} 
                height={80} 
                className={styles.thumbnailImage}
              />
              <div className={styles.overlay} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

