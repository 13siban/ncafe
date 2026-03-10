import React from 'react';
import Link from 'next/link';
import styles from '../../page.module.css';
import { TypeAnimation } from 'react-type-animation';

export function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroContent}>
                <div className={styles.heroText}>
                    <div className={styles.headerBadge}>
                        open: <strong>am 09:00</strong>&nbsp;&nbsp;&nbsp;close: <strong>pm 10:00</strong>
                    </div>
                    <h1 className={styles.heroTitle}>
                        My Moment,<br />
                    </h1>
                    <TypeAnimation
                        className={`${styles.heroTitle} ${styles.heroTitleType}`}
                        sequence={[
                            'Your Yearning.',
                            1500,
                            'Your Yielding.',
                            1500,
                            'Your Yonder.',
                            1500,
                            'Your Youth.',
                            1500,
                            'Your Yummy.',
                            1500,
                        ]}
                        wrapper="h1"
                        speed={10}
                        style={{ display: 'block' }}
                        repeat={Infinity}
                    />
                    <p className={styles.heroDescription}>
                        Experience the finest artisanal coffee in a space designed for creativity.<br />
                        커피의 본질, 그리고 영감을 깨우는 공간. 오늘 아침, 완벽한 한 잔을 경험해 보세요.
                    </p>

                    <div className={styles.heroButtons}>
                        <Link href="/menus" className={styles.primaryButton}>
                            Explore Menu
                        </Link>
                        <Link href="/about" className={styles.secondaryButton}>
                            Our Story
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
