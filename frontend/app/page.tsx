"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coffee, ArrowRight, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

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

import Header from '@/components/common/Header/Header';

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

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
    <main className={styles.main}>
      <Header />
      <div className={styles.contentWrapper}>

        {/* Hero Section */}
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
                <Link href="/admin/menus" className={styles.primaryButton}>
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
                    // Calculate the visual position relative to the active index
                    const total = HERO_IMAGES.length;
                    const offset = (index - activeIndex + total) % total;

                    // Determine layout position based on offset
                    // 0 = Active, 1 = Right, total-1 = Left
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
                      // Hidden cards: placed behind center, scaled down and invisible
                      xPosition = 0;
                      scale = 0.5;
                      opacity = 0;
                      zIndex = 0;
                    }

                    // Determine if this specific card is "wrapping around" (only for 3 cards jump)
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
                        style={{
                          originX: 0,
                        }}
                        onClick={() => {
                          setDirection(1); // Default to forward on click for now, or calculate based on index
                          setActiveIndex(index);
                        }}
                      >
                        <div className={styles.cardInner}>
                          <img
                            src={image.url}
                            alt={image.alt}
                            className={styles.cardImage}
                          />
                          {/* Dimming overlay for depth */}
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

        {/* Feature Sections */}
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
              <Link href="/menu" className={styles.moreLink}>
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
              <Link href="/menu" className={styles.moreLink}>
                MORE MENU <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
