'use client';

import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Card } from '@/components/common';
import { MenuFormValues } from '../MenuForm';
import { FormField } from '../FormField';
import styles from '../MenuForm.module.css';

interface StatusSectionProps {
  register: UseFormRegister<MenuFormValues>;
}

export const StatusSection = ({ register }: StatusSectionProps) => {
  return (
    <Card title="판매 상태" className={styles.section}>
      <Card.Body>
        <FormField label="노출 및 판매 상태">
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input 
                type="radio" 
                value="available" 
                {...register("status")}
              />
              <span style={{ fontWeight: 500 }}>판매중</span>
            </label>
            <label className={styles.radioLabel}>
              <input 
                type="radio" 
                value="soldout" 
                {...register("status")}
              />
              <span style={{ color: 'var(--color-warning)' }}>품절</span>
            </label>
            <label className={styles.radioLabel}>
              <input 
                type="radio" 
                value="hidden" 
                {...register("status")}
              />
              <span style={{ color: 'var(--color-gray-500)' }}>숨김 (미노출)</span>
            </label>
          </div>
        </FormField>
      </Card.Body>
    </Card>
  );
};
