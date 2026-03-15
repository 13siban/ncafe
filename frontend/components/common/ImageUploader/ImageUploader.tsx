'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  onInitialImagesChange?: (images: string[]) => void;
  initialImages?: string[];
  maxFiles?: number;
}

interface PreviewFile extends File {
  preview: string;
}

export type ImageItem = 
  | { type: 'existing'; url: string; id: string }
  | { type: 'new'; url: string; id: string; file: PreviewFile };

export const ImageUploader = ({
  onFilesChange,
  onInitialImagesChange,
  initialImages = [],
  maxFiles = 5
}: ImageUploaderProps) => {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update existingImages if prop changes (e.g. initial load)
  useEffect(() => {
    setExistingImages(initialImages);
  }, [initialImages]);

  // Cleanup previews when component unmounts
  useEffect(() => {
    // React 18 Strict Mode double-invokes effects, which causes URL.revokeObjectURL 
    // to destroy the preview image immediately after selection.
    // To prevent the X-box issue during registration, we avoid revoking URLs here.
    return () => { };
  }, [files]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const currentTotal = files.length + existingImages.length;
    const remainingSlots = maxFiles - currentTotal;

    if (remainingSlots <= 0) return;

    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const newFiles = filesToAdd.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    
    // Select the newly added image (first of the new batch)
    if (existingImages.length + files.length === 0) {
      setSelectedIndex(0);
    } else {
      setSelectedIndex(existingImages.length + files.length);
    }
  }, [files, existingImages, maxFiles, onFilesChange]);

  const removeFile = (file: PreviewFile) => {
    const updated = files.filter(f => f !== file);
    setFiles(updated);
    onFilesChange(updated);
    URL.revokeObjectURL(file.preview); // Cleanup only when explicitly removed
  };

  const removeExistingImage = (imageUrl: string) => {
    const updated = existingImages.filter(img => img !== imageUrl);
    setExistingImages(updated);
    if (onInitialImagesChange) {
      onInitialImagesChange(updated);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: maxFiles - existingImages.length, // Dynamic maxFiles for dropzone
    disabled: (files.length + existingImages.length) >= maxFiles
  });

  const allImages: ImageItem[] = [
    ...existingImages.map(url => ({ type: 'existing' as const, url, id: url })),
    ...files.map(f => ({ type: 'new' as const, url: f.preview, file: f, id: f.preview }))
  ];

  // Adjust selected index if an image is removed
  useEffect(() => {
    if (selectedIndex >= allImages.length) {
      setSelectedIndex(Math.max(0, allImages.length - 1));
    }
  }, [allImages.length, selectedIndex]);

  const mainImage = allImages[selectedIndex];

  if (allImages.length === 0) {
    return (
      <div className={styles.uploader}>
        <div className={styles.emptyContainer}>
          <span className={styles.emptyText}>등록된 이미지가 없습니다.</span>
          <div {...getRootProps({ className: styles.uploadBtnWrapper })}>
            <input {...getInputProps()} />
            <span className={styles.uploadBtn}>이미지 업로드하기</span>
          </div>
          <p className={styles.maxText}>(최대 {maxFiles}장)</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.uploader}>
      {/* Main Image View */}
      {mainImage && (
        <div className={styles.mainImageContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={mainImage.url} 
            alt="Main preview" 
            className={styles.mainImage} 
          />
        </div>
      )}

      {/* Thumbnails & Small Add Button */}
      <div className={styles.thumbnailList}>
        {allImages.map((img, idx) => (
          <div 
            key={img.id} 
            className={`${styles.thumbnailBtn} ${selectedIndex === idx ? styles.activeThumbnail : ''}`}
            onClick={() => setSelectedIndex(idx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={`thumb-${idx}`} className={styles.thumbnailImage} />
            <button
              type="button"
              className={styles.thumbnailRemove}
              onClick={(e) => {
                e.stopPropagation();
                if (img.type === 'existing') {
                  removeExistingImage(img.url);
                } else {
                  removeFile(img.file);
                }
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {allImages.length < maxFiles && (
          <div {...getRootProps({ className: styles.smallDropzone })}>
            <input {...getInputProps()} />
            <Upload className={styles.smallIcon} />
          </div>
        )}
      </div>
    </div>
  );
};
