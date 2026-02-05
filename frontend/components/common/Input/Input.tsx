// components/common/Input/Input.tsx
import React from 'react';
import styles from './Input.module.css';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  inputSize = 'md',
  leftIcon,
  rightIcon,
  required,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  const wrapperClasses = [
    styles.inputWrapper,
    styles[inputSize],
    error && styles.error,
    leftIcon && styles.hasLeftIcon,
    rightIcon && styles.hasRightIcon,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label
          htmlFor={inputId}
          className={`${styles.label} ${required ? styles.required : ''}`}
        >
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input id={inputId} className={styles.input} {...props} />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
      {helperText && !error && (
        <span className={styles.helperText}>{helperText}</span>
      )}
    </div>
  );
};

export default Input;
