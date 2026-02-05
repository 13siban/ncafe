'use client';

import React from 'react';
import { Control, useFieldArray, UseFormRegister } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import { Button, Input } from '@/components/common';
import { MenuFormValues } from '../MenuForm';
import styles from '../MenuForm.module.css';

interface MenuOptionFieldProps {
  control: Control<MenuFormValues>;
  register: UseFormRegister<MenuFormValues>;
  optionIndex: number;
  removeOption: (index: number) => void;
}

export const MenuOptionField = ({ control, register, optionIndex, removeOption }: MenuOptionFieldProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `options.${optionIndex}.items`
  });

  return (
    <div className={styles.optionCard}>
      <div className={styles.optionHeader}>
        <div className={styles.row} style={{ margin: 0, gap: '8px', flex: 1 }}>
          <input
            {...register(`options.${optionIndex}.name`, { required: true })}
            className={styles.select}
            placeholder="옵션명 (예: 사이즈)"
            style={{ width: '100%' }}
          />
          <select
            {...register(`options.${optionIndex}.type`)}
            className={styles.select}
            style={{ width: '100px' }}
          >
            <option value="radio">단일선택</option>
            <option value="checkbox">다중선택</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              {...register(`options.${optionIndex}.required`)}
              id={`req-${optionIndex}`}
            />
            <label htmlFor={`req-${optionIndex}`} style={{ fontSize: '14px' }}>필수</label>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeOption(optionIndex)}
          className={styles.removeButton} // Assuming removeButton style exists or I reuse something
          style={{ position: 'static', background: 'none', color: '#666', border: 'none', cursor: 'pointer' }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className={styles.optionItems}>
        {fields.map((item, itemIndex) => (
          <div key={item.id} className={styles.optionItemRow}>
            <Input
              {...register(`options.${optionIndex}.items.${itemIndex}.name`, { required: true })}
              placeholder="항목명 (예: Large)"
            />
            <Input
              type="number"
              {...register(`options.${optionIndex}.items.${itemIndex}.priceDelta`)}
              placeholder="추가금 (+)"
              style={{ width: '100px' }}
            />
            <button
              type="button"
              onClick={() => remove(itemIndex)}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => append({ name: '', priceDelta: 0 })}
          style={{ width: '100%' }}
        >
          <Plus size={14} /> 항목 추가
        </Button>
      </div>
    </div>
  );
};
