'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from '../page.module.css';

export function FeatureSections() {
    return (
        <section className={styles.sectionContainer}>
            {/* Coffee Section */}
            <div className={styles.featureRow}>
                <div className={styles.featureTextContent}>
                    <span className={styles.sectionLabel}>OUR COFFEE</span>
                    <h2 className={styles.sectionTitle}>
                        Choose your <br />
                        favourite coffee
                    </h2>
                    <p className={styles.sectionDescription}>
                        More than 100+ type of coffee are ready to serve by our professionals.
                        Experience the true taste of premium beans.
                    </p>
                    <div className={styles.menuList}>
                        <span>Cappucino</span>
                        <span className={styles.dot}>•</span>
                        <span>Latte</span>
                        <span className={styles.dot}>•</span>
                        <span>Arabica</span>
                    </div>
                    <Link href="/menus" className={styles.moreLink}>
                        MORE MENU <ArrowRight size={16} />
                    </Link>
                </div>
                <div className={styles.featureImageWrapper}>
                    <img
                        src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80"
                        alt="Pouring Coffee"
                        className={styles.featureImage}
                    />
                </div>
            </div>

            {/* Dessert Section */}
            <div className={`${styles.featureRow} ${styles.reverseRow}`}>
                <div className={styles.featureImageWrapper}>
                    <img
                        src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80"
                        alt="Delicious Desserts"
                        className={styles.featureImage}
                    />
                </div>
                <div className={styles.featureTextContent}>
                    <span className={styles.sectionLabel}>OUR DESSERTS</span>
                    <h2 className={styles.sectionTitle}>
                        Complete your <br />
                        coffee with sweets
                    </h2>
                    <p className={styles.sectionDescription}>
                        Enjoy your coffee with our tasty desserts that will build your mood.
                        Freshly baked every morning.
                    </p>
                    <div className={styles.menuList}>
                        <span>Croissant</span>
                        <span className={styles.dot}>•</span>
                        <span>Tiramisu</span>
                        <span className={styles.dot}>•</span>
                        <span>Cheesecake</span>
                    </div>
                    <Link href="/menus" className={styles.moreLink}>
                        MORE MENU <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
