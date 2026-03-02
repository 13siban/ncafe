'use client';

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Card, Input } from '@/components/common';
import { CategoryResponseDto } from '@/components/menu/types';
import { MenuFormValues } from '../MenuForm';
import { FormField } from '../FormField';
import styles from '../MenuForm.module.css';

interface BasicInfoSectionProps {
  register: UseFormRegister<MenuFormValues>;
  errors: FieldErrors<MenuFormValues>;
  categories: CategoryResponseDto[];
}

export const BasicInfoSection = ({ register, errors, categories }: BasicInfoSectionProps) => {
  return (
    <Card title="기본 정보" className={styles.section}>
      <Card.Body>
        <div className={styles.row}>
          <FormField label="메뉴명 (한글)" error={errors.korName?.message} required>
            <Input
              {...register("korName", { required: "한글 메뉴명을 입력해주세요" })}
              placeholder="예: 아메리카노"
            />
          </FormField>
          <FormField label="메뉴명 (영문)" error={errors.engName?.message} required>
            <Input
              {...register("engName", { required: "영문 메뉴명을 입력해주세요" })}
              placeholder="예: Americano"
            />
          </FormField>
        </div>

        <div className={styles.row}>
          <FormField label="가격" error={errors.price?.message} required>
            <Input
              type="number"
              {...register("price", {
                required: "가격을 입력해주세요",
                min: { value: 0, message: "가격은 0원 이상이어야 합니다" }
              })}
              placeholder="0"
            />
          </FormField>
          <FormField label="카테고리">
            <select {...register("categoryId")} className={styles.select}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="설명">
          <textarea
            {...register("description")}
            className={styles.textarea}
            placeholder="메뉴에 대한 설명을 입력해주세요"
          />
        </FormField>
      </Card.Body>
    </Card>
  );
};
