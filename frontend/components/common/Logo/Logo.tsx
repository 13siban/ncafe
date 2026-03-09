import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
    className?: string;
    variant?: 'white' | 'black';
}

export const Logo = ({ className, variant = 'white' }: LogoProps) => {
    const src = variant === 'white' ? '/logo-white.png' : '/logo-black.png';

    return (
        <div className={`${styles.logoWrapper} ${className || ''}`}>
            <img
                src={src}
                alt="mymyy logo"
                className={styles.logoImage}
            />
        </div>
    );
};
