'use client';

import React from 'react';
import { UseFormRegister, Control } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Card } from '@/components/common';
import { MenuFormValues } from '../MenuForm';
import { MenuOptionField } from './MenuOptionField';
import styles from '../MenuForm.module.css';

interface OptionSectionProps {
  register: UseFormRegister<MenuFormValues>;
  control: Control<MenuFormValues>;
  fields: any[];
  append: (value: any) => void;
  remove: (index: number) => void;
}

export const OptionSection = ({ register, control, fields, append, remove }: OptionSectionProps) => {
  return (
    <Card title="옵션 관리" className={styles.section}>
      <Card.Body>
        <div className={styles.optionList}>
          {fields.map((field, index) => (
            <MenuOptionField
              key={field.id}
              control={control}
              register={register}
              optionIndex={index}
              removeOption={remove}
            />
          ))}
        </div>
        <button 
          type="button" 
          className={styles.addOptionBtn}
          onClick={() => append({ 
            name: '', 
            type: 'radio', 
            required: true, 
            items: [{ name: '', priceDelta: 0 }] 
          })}
        >
          <Plus size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          옵션 그룹 추가
        </button>
      </Card.Body>
    </Card>
  );
};
