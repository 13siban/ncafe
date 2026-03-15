'use client';

import React from 'react';
import Header from '@/components/common/Header/Header';
import { Footer } from '@/components/common';
import GradeSection from './_components/GradeSection/GradeSection';
import styles from './page.module.css';
import { motion } from 'framer-motion';

export default function AboutPage() {
    return (
        <main className={styles.main}>
            <Header />
            <div className={styles.content}>
                <section className={styles.heroSection}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className={styles.heroText}
                    >
                        <span className={styles.subtitle}>OUR STORY</span>
                        <h1 className={styles.title}>Crafting Moments,<br />One Cup at a Time.</h1>
                        <p className={styles.description}>
                            ncafe는 평범한 일상 속에서 특별한 영감을 찾는 사람들을 위한 공간입니다.<br />
                            최상의 원두와 정성스러운 브루잉을 통해 완벽한 한 잔의 경험을 선사합니다.
                        </p>
                    </motion.div>
                </section>

                <section className={styles.missionSection}>
                    <div className={styles.grid}>
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className={styles.imageWrapper}
                        >
                            <img 
                                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80" 
                                alt="Coffee Brewing" 
                                className={styles.image}
                            />
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className={styles.textWrapper}
                        >
                            <h2 className={styles.sectionTitle}>Our Philosophy</h2>
                            <p className={styles.sectionText}>
                                우리는 단순히 커피를 파는 곳이 아닙니다. 우리는 사람과 사람이 연결되고,<br />
                                새로운 아이디어가 탄생하며, 지친 일상에 잠시 쉼표를 찍을 수 있는 문화를 만듭니다.
                            </p>
                            <div className={styles.stats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>100%</span>
                                    <span className={styles.statLabel}>Specialty Beans</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>15+</span>
                                    <span className={styles.statLabel}>Local Partners</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <GradeSection />
            </div>
            <Footer />
        </main>
    );
}
