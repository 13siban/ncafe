'use client';

import React from 'react';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { Card, ImageUploader } from '@/components/common';
import { MenuFormValues } from '../MenuForm';
import styles from '../MenuForm.module.css';

interface ImageSectionProps {
  control: Control<MenuFormValues>;
  setValue: UseFormSetValue<MenuFormValues>;
  existingImages?: string[];
}

export const ImageSection = ({ control, setValue, existingImages }: ImageSectionProps) => {
  return (
    <Card title="메뉴 이미지" className={styles.section}>
      <Card.Body>
        <Controller
          control={control}
          name="images"
          render={({ field: { onChange } }) => (
            <ImageUploader 
              onFilesChange={onChange}
              initialImages={existingImages}
              onInitialImagesChange={(imgs) => setValue('existingImages', imgs)}
              maxFiles={3}
            />
          )}
        />
      </Card.Body>
    </Card>
  );
};
