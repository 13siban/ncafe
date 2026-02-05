'use client';

import React from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  error,
  required,
  children,
  className = '',
}: FormFieldProps) => {
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label className={`${styles.label} ${required ? styles.required : ''}`}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        {children}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};
