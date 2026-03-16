import React from 'react';
import styles from './loading.module.css';

export default function Loading() {
    const text = "mymyy";
    const letters = text.split("");

    return (
        <div className={styles.container}>
            <div className={styles.textWrapper}>
                {letters.map((char, index) => (
                    <span key={index} className={styles.letter}>
                        {char}
                    </span>
                ))}
            </div>
            <div className={styles.spinner} />
        </div>
    );
}
