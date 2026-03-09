import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import styles from './Footer.module.css';

export const Footer = () => {
    return (
        <footer className={styles.footer}>
            {/* CTA Section */}
            <div className={styles.ctaSection}>
                <h2 className={styles.ctaTitle}>Let&apos;s feel that taste of coffee together</h2>
                <Link href="/menus" className={styles.menuButton}>
                    MENU
                </Link>
            </div>

            {/* Main Footer Content */}
            <div className={styles.mainFooter}>
                <div className={styles.footerContainer}>
                    {/* Left Side: Logo & Description */}
                    <div className={styles.footerLeft}>
                        <div className={styles.logo}>NCafe</div>
                        <p className={styles.description}>
                            맛있는 커피와 함께하는 즐거운 시간,<br />
                            최고의 원두와 정성으로 여러분을 기다립니다.
                        </p>
                        <div className={styles.socials}>
                            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                        </div>
                    </div>

                    {/* Right Side: Links */}
                    <nav className={styles.footerNav}>
                        <Link href="/">Home</Link>
                        <Link href="/about">About</Link>
                        <Link href="/shop">Shop</Link>
                        <Link href="/menus">Menu</Link>
                        <Link href="/blog">Blog</Link>
                    </nav>
                </div>

                {/* Bottom Bar: Copyright */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        © 2024 NCafe. All Rights Reserved. Licensing<br />
                        Webflow Templates by 128.Digital. Powered by NCafe
                    </p>
                </div>
            </div>
        </footer>
    );
};

