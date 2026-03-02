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

export const ImageUploader = ({
  onFilesChange,
  onInitialImagesChange,
  initialImages = [],
  maxFiles = 5
}: ImageUploaderProps) => {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);

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

  return (
    <div className={styles.uploader}>
      <div {...getRootProps({ className: `${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}` })}>
        <input {...getInputProps()} />
        <Upload className={styles.icon} />
        <div className={styles.text}>
          <p className={styles.highlight}>클릭하여 이미지 업로드</p>
          <p>또는 이미지를 여기로 드래그하세요</p>
        </div>
        <p className={styles.text} style={{ fontSize: '0.8rem' }}>
          (최대 {maxFiles}장)
        </p>
      </div>

      {(files.length > 0 || existingImages.length > 0) && (
        <div className={styles.previewGrid}>
          {/* Existing Images */}
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className={styles.previewItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                className={styles.previewImage}
                alt={`existing-${index}`}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  removeExistingImage(url);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* New Files */}
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className={styles.previewItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.preview}
                className={styles.previewImage}
                alt={`preview-${index}`}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
