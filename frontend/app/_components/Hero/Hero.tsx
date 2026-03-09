import React from 'react';
import Link from 'next/link';
import styles from '../../page.module.css';

export function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroContent}>
                <div className={styles.heroText}>
                    <div className={styles.headerBadge}>
                        Recently updated: <strong>Menu 2.0</strong>
                    </div>
                    <h1 className={styles.heroTitle}>
                        Brewed to<br />
                        Perfection.
                    </h1>
                    <p className={styles.heroDescription}>
                        Experience the finest artisanal coffee in a space designed for comfort and creativity.
                        Start your day with the perfect cup.
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
