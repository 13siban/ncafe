'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../page.module.css';

const HERO_IMAGES = [
    {
        id: 1,
        url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80",
        alt: "Cozy Cafe Interior"
    },
    {
        id: 2,
        url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80",
        alt: "Coffee Pouring"
    },
    {
        id: 3,
        url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80",
        alt: "Latte Art"
    },
    {
        id: 4,
        url: "https://images.unsplash.com/photo-1506372023823-741c83b836fe?auto=format&fit=crop&q=80",
        alt: "Coffee Aesthetic"
    }
];

export function Hero() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setActiveIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [activeIndex]);

    const nextSlide = () => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
    };

    return (
        <section className={styles.hero}>
            <div className={styles.heroContent}>
                <div className={styles.heroText}>
                    <span className={styles.badge}>New Opening</span>
                    <h1 className={styles.heroTitle}>
                        Brewed to <br />
                        <span className={styles.highlight}>Perfection.</span>
                    </h1>
                    <p className={styles.heroDescription}>
                        Experience the finest artisanal coffee in a space designed for comfort and creativity.
                        Start your day with the perfect cup.
                    </p>

                    <div className={styles.heroButtons}>
                        <Link href="/menus" className={styles.primaryButton}>
                            Explore Menu
                            <ArrowRight size={20} />
                        </Link>
                        <Link href="/about" className={styles.secondaryButton}>
                            Our Story
                        </Link>
                    </div>

                    <div className={styles.features}>
                        <div className={styles.featureItem}>
                            <MapPin size={18} />
                            <span>Gangnam, Seoul</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Clock size={18} />
                            <span>Open 7am - 10pm</span>
                        </div>
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    <div className={styles.carouselContainer}>
                        <AnimatePresence mode='popLayout'>
                            {HERO_IMAGES.map((image, index) => {
                                const total = HERO_IMAGES.length;
                                const offset = (index - activeIndex + total) % total;

                                let xPosition = 0;
                                let scale = 1;
                                let opacity = 1;
                                let zIndex = 10;

                                if (offset === 0) {
                                    xPosition = 0;
                                    scale = 1;
                                    opacity = 1;
                                    zIndex = 10;
                                } else if (offset === 1) {
                                    xPosition = 120;
                                    scale = 0.8;
                                    opacity = 1;
                                    zIndex = 5;
                                } else if (offset === total - 1 && total > 2) {
                                    xPosition = -50;
                                    scale = 0.8;
                                    opacity = 1;
                                    zIndex = 5;
                                } else {
                                    xPosition = 0;
                                    scale = 0.5;
                                    opacity = 0;
                                    zIndex = 0;
                                }

                                const isWrapping = total === 3 && (
                                    (direction === 1 && offset === 1) ||
                                    (direction === -1 && offset === 2)
                                );

                                return (
                                    <motion.div
                                        key={image.id}
                                        layoutId={`card-${image.id}`}
                                        className={styles.carouselCard}
                                        initial={false}
                                        animate={{
                                            x: xPosition,
                                            scale: scale,
                                            opacity: isWrapping ? [0.5, 1] : opacity,
                                            zIndex: zIndex
                                        }}
                                        transition={{
                                            x: isWrapping
                                                ? { duration: 0.2, ease: "easeInOut" }
                                                : { duration: 0.4, ease: "circOut" },
                                            opacity: { duration: 0.3 },
                                            scale: isWrapping
                                                ? { duration: 0.2, ease: "easeInOut" }
                                                : { duration: 0.4, ease: "circOut" },
                                            zIndex: { duration: 0 }
                                        }}
                                        style={{ originX: 0 }}
                                        onClick={() => {
                                            setDirection(1);
                                            setActiveIndex(index);
                                        }}
                                    >
                                        <div className={styles.cardInner}>
                                            <img src={image.url} alt={image.alt} className={styles.cardImage} />
                                            <motion.div
                                                className={styles.cardOverlay}
                                                animate={{ opacity: offset === 0 ? 0 : 0.6 }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        <button onClick={prevSlide} className={`${styles.controlButton} ${styles.prevButton}`} aria-label="Previous slide">
                            <ChevronLeft size={32} />
                        </button>
                        <button onClick={nextSlide} className={`${styles.controlButton} ${styles.nextButton}`} aria-label="Next slide">
                            <ChevronRight size={32} />
                        </button>

                        <div className={styles.carouselControls}>
                            <div className={styles.indicators}>
                                {HERO_IMAGES.map((_, idx) => (
                                    <button
                                        key={idx}
                                        className={`${styles.indicator} ${idx === activeIndex ? styles.activeIndicator : ''}`}
                                        onClick={() => setActiveIndex(idx)}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
