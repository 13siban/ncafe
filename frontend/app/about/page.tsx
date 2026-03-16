'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/common/Header/Header';
import { Footer } from '@/components/common';
import styles from './page.module.css';
import { motion } from 'framer-motion';
import GallerySection from './_components/GallerySection/GallerySection';
import PartnerSection from './_components/PartnerSection/PartnerSection';
import { fetchAPI } from '@/app/lib/api/client';

export default function AboutPage() {
    const [storeInfo, setStoreInfo] = useState({ tel: '', addressEn: '', address: '' });

    useEffect(() => {
        fetchAPI('/store/status')
            .then(res => {
                setStoreInfo({
                    tel: res.contactNumber || '',
                    addressEn: res.addressEn || '',
                    address: res.address || ''
                });
            })
            .catch(e => console.error('Failed to fetch store info', e));
    }, []);

    return (
        <main className={styles.main}>
            <Header />
            <div className={styles.content}>
                <section className={styles.heroSection}>
                    <div className={styles.heroBackground}>
                        <img 
                            src="/about.png"
                            alt="Coffee Shop Interior"
                        />
                    </div>
                    <div className={styles.heroOverlay} />
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.3,
                                    delayChildren: 0.2
                                }
                            }
                        }}
                        className={styles.heroText}
                    >
                        <motion.span 
                            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
                            className={styles.subtitle}
                        >
                            OUR STORY
                        </motion.span>
                        <motion.h1 
                            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
                            className={styles.title}
                        >
                            Crafting Moments,<br /><span style={{ whiteSpace: 'nowrap' }}>One Cup at a Time.</span>
                        </motion.h1>
                        <motion.div 
                            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
                            className={styles.descriptionWrapper}
                        >
                            <p className={styles.description}>
                                At mymyy, we find extraordinary inspiration in your daily routine.<br />
                                Delivering the ultimate coffee experience with our finest brews.
                            </p>
                            <p className={styles.description}>
                                mymyy는 평범한 일상 속에서 특별한 영감을 찾는 사람들을 위한 공간입니다.<br />
                                최상의 원두와 정성스러운 브루잉을 통해 완벽한 한 잔의 경험을 선사합니다.
                            </p>
                        </motion.div>
                    </motion.div>
                </section>

                <section className={styles.howToGetHereSection}>
                    <div className={`${styles.featureRow} ${styles.desktopTextFirst}`}>
                        <div className={styles.featureImageWrapper}>
                            <img
                                src="/How-to-Get-Here.png"
                                alt="How to Get Here"
                                className={styles.featureImage}
                            />
                        </div>
                        <motion.div
                            className={styles.featureTextContent}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className={styles.sectionLabel}>LOCATION</span>
                            <h2 className={styles.sectionTitle}>How to Get Here</h2>
                            <div className={styles.contactInfo}>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactValue}>Tel.{storeInfo.tel || '...'}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactValue}>{storeInfo.addressEn || '...'}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactValue}>{storeInfo.address || '...'}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Infinite Scrolling Gallery Section */}
                <GallerySection />
                
                {/* Partner Sites Section */}
                <PartnerSection />
            </div>
            <Footer />
        </main>
    );
}
