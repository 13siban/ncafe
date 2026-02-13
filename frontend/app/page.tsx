import Link from 'next/link';
import { Coffee, ArrowRight, MapPin, Clock } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <Coffee size={24} />
            <span>NCafe</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/menu">Menu</Link>
            <Link href="/about">About</Link>
            <Link href="/locations">Locations</Link>
          </div>
          <Link href="/admin" className={styles.loginButton}>
            Admin
          </Link>
        </div>
      </nav>

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
            <div className={styles.visualContent}>
              <div className={styles.imageWrapper}>
                <img
                  src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80"
                  alt="Cafe Interior"
                  className={styles.heroImage}
                />
              </div>
              <div className={styles.floatingCard}>
                <div className={styles.cardIcon}>☕️</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>Daily Roast</span>
                  <span className={styles.cardSubtitle}>Best Vanilla Latte</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
