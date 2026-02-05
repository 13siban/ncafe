// components/common/Card/Card.tsx
import React from 'react';
import styles from './Card.module.css';

type CardVariant = 'elevated' | 'outlined';
type CardPadding = 'noPadding' | 'compact' | 'default' | 'spacious';

interface CardProps {
  title?: string;
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

interface CardImageProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> & {
  Image: React.FC<CardImageProps>;
  Body: React.FC<CardBodyProps>;
  Header: React.FC<CardHeaderProps>;
  Footer: React.FC<CardFooterProps>;
} = ({
  title,
  variant = 'elevated',
  padding = 'default',
  interactive = false,
  onClick,
  className,
  children,
}) => {
  const classNames = [
    styles.card,
    styles[variant],
    padding !== 'default' && styles[padding],
    interactive && styles.interactive,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

const CardImage: React.FC<CardImageProps> = ({ children, className }) => (
  <div className={`${styles.cardImage} ${className || ''}`}>{children}</div>
);

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={`${styles.cardBody} ${className || ''}`}>{children}</div>
);

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={`${styles.cardHeader} ${className || ''}`}>{children}</div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={`${styles.cardFooter} ${className || ''}`}>{children}</div>
);

Card.Image = CardImage;
Card.Body = CardBody;
Card.Header = CardHeader;
Card.Footer = CardFooter;

export default Card;
