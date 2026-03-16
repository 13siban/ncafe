'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import NextImage from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import styles from '../../page.module.css';

interface ImageGalleryProps {
    images: any[];
    menuName: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, menuName }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    return (
        <>
            <div className={styles.imageGalleryContainer}>
                <div
                    className={styles.imageSection}
                    onClick={() => { if (images?.length) setIsImageModalOpen(true); }}
                    style={{ cursor: images?.length ? 'pointer' : 'default' }}
                >
                    {images && images.length > 0 ? (
                        <NextImage
                            src={`/images/${images[selectedImageIndex]?.srcUrl || images[0].srcUrl}`}
                            alt={menuName}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 900px) 100vw, 500px"
                            priority
                        />
                    ) : (
                        <div className={styles.placeholder}>
                            <UtensilsCrossed size={64} strokeWidth={1} />
                        </div>
                    )}
                </div>

                {images && images.length > 1 && (
                    <div className={styles.thumbnailList}>
                        {images.map((img: any, idx: number) => (
                            <button
                                key={idx}
                                className={`${styles.thumbnailBtn} ${idx === selectedImageIndex ? styles.activeThumbnail : ''}`}
                                onClick={() => setSelectedImageIndex(idx)}
                            >
                                <NextImage
                                    src={`/images/${img.srcUrl}`}
                                    alt={`${menuName} 썸네일 ${idx + 1}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isImageModalOpen && images && images.length > 0 && typeof document !== 'undefined' && createPortal(
                <div className={styles.imageModalOverlay} onClick={() => setIsImageModalOpen(false)}>
                    <div className={styles.imageModalContent} onClick={e => e.stopPropagation()}>
                        <NextImage
                            src={`/images/${images[selectedImageIndex]?.srcUrl || images[0].srcUrl}`}
                            alt={`${menuName} 원본 이미지`}
                            layout="fill"
                            objectFit="contain"
                        />
                        <button className={styles.closeImageModalBtn} onClick={() => setIsImageModalOpen(false)}>×</button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default ImageGallery;
