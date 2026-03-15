'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './FeatureSections.module.css';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        }
    }
};

const childVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
};

export function FeatureSections() {
    return (
        <section className={styles.sectionContainer}>
            {/* Coffee Section */}
            <div className={`${styles.featureRow} ${styles.desktopTextFirst}`}>
                <div className={styles.featureImageWrapper}>
                    <img
                        src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80"
                        alt="Pouring Coffee"
                        className={styles.featureImage}
                    />
                </div>
                <motion.div
                    className={styles.featureTextContent}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={containerVariants}
                >
                    <motion.span variants={childVariants} className={styles.sectionLabel}>OUR COFFEE</motion.span>
                    <motion.h2 variants={childVariants} className={styles.sectionTitle}>
                        Choose your <br />
                        favourite coffee
                    </motion.h2>
                    <motion.p variants={childVariants} className={styles.sectionDescription}>
                        More than 100+ type of coffee are ready to serve by our professionals.
                        Experience the true taste of premium beans.
                    </motion.p>
                    <motion.div variants={childVariants} className={styles.menuList}>
                        <span>Cappucino</span>
                        <span className={styles.dot}>•</span>
                        <span>Latte</span>
                        <span className={styles.dot}>•</span>
                        <span>Arabica</span>
                    </motion.div>
                    <motion.div variants={childVariants}>
                        <Link href="/menus" className={styles.moreLink}>
                            MORE MENU <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            {/* Dessert Section */}
            <div className={styles.featureRow}>
                <div className={styles.featureImageWrapper}>
                    <img
                        src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80"
                        alt="Delicious Desserts"
                        className={styles.featureImage}
                    />
                </div>
                <motion.div
                    className={styles.featureTextContent}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={containerVariants}
                >
                    <motion.span variants={childVariants} className={styles.sectionLabel}>OUR DESSERTS</motion.span>
                    <motion.h2 variants={childVariants} className={styles.sectionTitle}>
                        Complete your <br />
                        coffee with sweets
                    </motion.h2>
                    <motion.p variants={childVariants} className={styles.sectionDescription}>
                        Enjoy your coffee with our tasty desserts that will build your mood.
                        Freshly baked every morning.
                    </motion.p>
                    <motion.div variants={childVariants} className={styles.menuList}>
                        <span>Croissant</span>
                        <span className={styles.dot}>•</span>
                        <span>Tiramisu</span>
                        <span className={styles.dot}>•</span>
                        <span>Cheesecake</span>
                    </motion.div>
                    <motion.div variants={childVariants}>
                        <Link href="/menus" className={styles.moreLink}>
                            MORE MENU <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
