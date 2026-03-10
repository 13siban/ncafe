import React from 'react';
import Link from 'next/link';
import styles from './Hero.module.css';
import { TypeAnimation } from 'react-type-animation';

import { motion, Variants } from 'framer-motion';

export function Hero() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" },
        },
    };

    return (
        <section className={styles.hero}>
            <div className={styles.heroContent}>
                <motion.div
                    className={styles.heroText}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className={styles.headerBadge}>
                        open: <strong>am 09:00</strong>&nbsp;&nbsp;&nbsp;close: <strong>pm 10:00</strong>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className={styles.heroTitle}>
                        My Moment,<br />
                    </motion.h1>

                    <motion.div variants={itemVariants}>
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
                    </motion.div>

                    <motion.p variants={itemVariants} className={styles.heroDescription}>
                        Experience the finest artisanal coffee in a space designed for creativity.<br />
                        커피의 본질, 그리고 영감을 깨우는 공간. 오늘 아침, 완벽한 한 잔을 경험해 보세요.
                    </motion.p>

                    <motion.div variants={itemVariants} className={styles.heroButtons}>
                        <Link href="/menus" className={styles.primaryButton}>
                            Explore Menu
                        </Link>
                        <Link href="/about" className={styles.secondaryButton}>
                            Our Story
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
