'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/common';
import { categories } from '@/mocks/menuData';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { OptionSection } from './sections/OptionSection';
import { ImageSection } from './sections/ImageSection';
import { StatusSection } from './sections/StatusSection';
import styles from './MenuForm.module.css';

export type MenuFormValues = {
  korName: string;
  engName: string;
  description: string;
  price: number;
  categoryId: string | number;
  status: 'available' | 'soldout' | 'hidden';
  images: File[];
  existingImages?: string[];
  options: {
    name: string;
    type: 'radio' | 'checkbox';
    required: boolean;
    items: {
      name: string;
      priceDelta: number;
    }[];
  }[];
};

interface MenuFormProps {
  initialValues?: Partial<MenuFormValues>;
  onSubmit: (data: MenuFormValues) => Promise<void>;
  submitLabel?: string;
}

export const MenuForm = ({ initialValues, onSubmit, submitLabel = '메뉴 등록하기' }: MenuFormProps) => {
  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting }, watch } = useForm<MenuFormValues>({
    defaultValues: {
      korName: '',
      engName: '',
      description: '',
      price: 0,
      categoryId: categories[1]?.id || 'coffee',
      status: 'available',
      images: [],
      existingImages: [],
      options: [],
      ...initialValues
    }
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: "options"
  });

  const existingImages = watch('existingImages');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.mainColumn}>
        <BasicInfoSection register={register} errors={errors} />
        <OptionSection 
          register={register} 
          control={control} 
          fields={optionFields} 
          append={appendOption} 
          remove={removeOption} 
        />
      </div>

      <div className={styles.sideColumn}>
        <ImageSection 
          control={control} 
          setValue={setValue} 
          existingImages={existingImages} 
        />
        <StatusSection register={register} />
        
        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? '처리 중...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
