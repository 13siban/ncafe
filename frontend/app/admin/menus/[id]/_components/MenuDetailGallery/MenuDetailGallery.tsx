import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './MenuDetailGallery.module.css';
import { useMenuImages, MenuImageResponse } from './useMenuImages';

interface MenuDetailGalleryProps {
  menuID: number;
}

export const MenuDetailGallery = ({ menuID }: MenuDetailGalleryProps) => {
  const { images, korName, isLoading, error, setPrimaryImage, deleteImage, uploadImages } = useMenuImages(menuID);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 목록이 로드되면 첫 번째 이미지를 선택
  useEffect(() => {
    if (images.length > 0) {
      // 이미지가 바뀌었거나, 선택된 이미지가 삭제된 경우 첫번째로 자동 선택
      const stillExists = images.find(img => img.id === selectedImageId);
      if (!stillExists) {
        setSelectedImageId(images[0].id);
      }
    } else {
      setSelectedImageId(null);
    }
  }, [images, selectedImageId]);

  if (isLoading) return <div className={styles.emptyContainer}>로딩 중...</div>;
  if (error) return <div className={styles.emptyContainer}>{error}</div>;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await uploadImages(files);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // reset
      }
    }
  };

  const selectedImage = images.find((img: MenuImageResponse) => img.id === selectedImageId) || images[0];

  // 백엔드 서버 주소를 포함한 전체 이미지 URL 반환
  const getImageUrl = (srcUrl: string) => {
    if (!srcUrl) return '';
    if (srcUrl.startsWith('http')) return srcUrl;
    // /api/upload 경로로 요청하면 Catch-all API Proxy가 이를 
    // Spring Boot의 /upload 경로로 변환하여 파일 서버로 전달합니다.
    return `/api/upload/${srcUrl}`;
  };

  if (!selectedImage || images.length === 0) {
    return (
      <div className={styles.emptyContainer} style={{ flexDirection: 'column', gap: '1rem' }}>
        <span className={styles.emptyText}>등록된 이미지가 없습니다.</span>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="empty-file-upload"
        />
        <label htmlFor="empty-file-upload" className={styles.uploadBtn}>
          이미지 업로드하기
        </label>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div 
        className={styles.mainImageWrapper}
        onClick={() => setIsModalOpen(true)}
        style={{ cursor: 'pointer' }}
      >
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

      <div className={styles.actionButtons}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
          ref={fileInputRef}
        />
        <label htmlFor="file-upload" className={styles.uploadBtn}>
          이미지 추가
        </label>

        {selectedImage.sortOrder !== 1 && (
          <button
            className={styles.setPrimaryBtn}
            onClick={() => setPrimaryImage(selectedImage.id)}
          >
            대표 이미지로 설정
          </button>
        )}
        <button
          className={styles.deleteBtn}
          onClick={() => deleteImage(selectedImage.id)}
        >
          이미지 삭제
        </button>
      </div>

      {images.length > 0 && (
        <div className={styles.thumbnailList}>
          {images.map((img: MenuImageResponse) => (
            <button
              key={img.id}
              className={`${styles.thumbnailButton} ${selectedImage.id === img.id ? styles.active : ''}`}
              onClick={() => setSelectedImageId(img.id)}
            >
              <Image
                src={getImageUrl(img.srcUrl)}
                alt={img.altText || "썸네일"}
                width={60}
                height={80}
                className={styles.thumbnailImage}
              />
              <div className={styles.overlay} />
            </button>
          ))}
        </div>
      )}

      {/* Image Modal - Rendered via Portal to escape parent z-index issues */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Image
              src={getImageUrl(selectedImage.srcUrl)}
              alt="메뉴 이미지 원본"
              layout="fill"
              objectFit="contain"
            />
            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
