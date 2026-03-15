'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { galleryAPI } from '@/app/lib/api';
import styles from './GallerySetting.module.css';

interface GalleryImage {
    id: number;
    imageUrl: string;
    sortOrder: number;
    isVisible: boolean;
}

export function GallerySetting() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const fetchImages = async () => {
        try {
            const data = await galleryAPI.getAdminImages();
            setImages(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setIsUploading(true);
        try {
            for (const file of acceptedFiles) {
                await galleryAPI.uploadImage(file);
            }
            await fetchImages();
        } catch (error: any) {
            alert('업로드 실패: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        disabled: isUploading,
    });

    const toggleVisibility = async (id: number, currentVisible: boolean) => {
        try {
            await galleryAPI.updateImage(id, { isVisible: !currentVisible });
            fetchImages();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            try {
                await galleryAPI.deleteImage(id);
                fetchImages();
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (isLoading) return <p>불러오는 중...</p>;

    return (
        <section className={styles.card}>
            <div className={styles.cardHeader}>
                <ImageIcon className={styles.cardIcon} size={20} />
                <h2 className={styles.cardTitle}>About 갤러리 설정</h2>
            </div>
            <div className={styles.cardContent}>
                {/* 직접 드롭존 */}
                <div
                    {...getRootProps({ className: `${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}` })}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <p className={styles.dropzoneText}>업로드 중...</p>
                    ) : isDragActive ? (
                        <p className={styles.dropzoneText}>여기에 놓으세요!</p>
                    ) : (
                        <div className={styles.dropzoneInner}>
                            <Upload size={24} color="#888" />
                            <p className={styles.dropzoneText}>클릭하거나 이미지를 드래그하여 업로드</p>
                        </div>
                    )}
                </div>

                <div className={styles.imageList}>
                    {images.length === 0 ? (
                        <p className={styles.emptyText}>등록된 이미지가 없습니다.</p>
                    ) : (
                        images.map(img => (
                            <div key={img.id} className={styles.imageItem}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/images/${img.imageUrl}`} alt="Gallery" className={styles.imgPreview} />
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={() => toggleVisibility(img.id, img.isVisible)}
                                    >
                                        {img.isVisible ? <Eye size={18} color="#27ae60" /> : <EyeOff size={18} color="#e74c3c" />}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={() => handleDelete(img.id)}
                                    >
                                        <Trash2 size={18} color="#e74c3c" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
