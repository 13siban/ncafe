'use client';

import React from 'react';
import styles from './PartnerSection.module.css';
import { motion } from 'framer-motion';

const THEMES = {
    blue: {
        '--theme-bg': '#f0f8ff',
        '--theme-border': '#e0f2fe',
        '--theme-title': '#075985',
        '--theme-desc': '#475569',
        '--theme-tag-bg': '#e0f2fe',
        '--theme-tag-text': '#0284c7',
        '--theme-url': '#38bdf8'
    },
    yellow: {
        '--theme-bg': '#fffbeb',
        '--theme-border': '#fef08a',
        '--theme-title': '#783c00',
        '--theme-desc': '#78716c',
        '--theme-tag-bg': '#fef08a',
        '--theme-tag-text': '#d97706',
        '--theme-url': '#d97706'
    },
    dark: {
        '--theme-bg': '#1e1b4b',
        '--theme-border': '#312e81',
        '--theme-title': '#ffffff',
        '--theme-desc': '#94a3b8',
        '--theme-tag-bg': '#312e81',
        '--theme-tag-text': '#818cf8',
        '--theme-url': '#6366f1'
    },
    purple: {
        '--theme-bg': '#faf5ff',
        '--theme-border': '#f3e8ff',
        '--theme-title': '#4c1d95',
        '--theme-desc': '#7e22ce',
        '--theme-tag-bg': '#f3e8ff',
        '--theme-tag-text': '#9333ea',
        '--theme-url': '#a855f7'
    },
    orange: {
        '--theme-bg': '#fff7ed',
        '--theme-border': '#ffedd5',
        '--theme-title': '#7f1d1d',
        '--theme-desc': '#9a3412',
        '--theme-tag-bg': '#ffedd5',
        '--theme-tag-text': '#ea580c',
        '--theme-url': '#ea580c'
    }
};

const PARTNERS = [
    {
        id: 'squirtle',
        title: '꼬부기 카페',
        description: '톡 쏘는 물보라처럼 신선한 원두, 한강의 푸름을 담은 휴식 한잔',
        tags: [
            { icon: '💧', text: '물보라' },
            { icon: '💧', text: '리프레시' },
            { icon: '💧', text: '투명함' }
        ],
        url: 'officebeom.co.kr',
        href: 'https://officebeom.co.kr',
        image: '/link/squirtle_card.webp',
        theme: 'blue',
        badge: '현재 위치'
    },
    {
        id: 'psyduck',
        title: '고라파덕 카페',
        description: '고라파덕의 서툰 손길이 빚어낸, 세상에서 가장 귀여운 한 잔',
        tags: [
            { icon: '✨', text: '엉뚱함' },
            { icon: '✨', text: '따뜻함' }
        ],
        url: 'mesilver.co.kr',
        href: 'https://mesilver.co.kr',
        image: '/link/psyduck_card.webp',
        theme: 'yellow'
    },
    {
        id: 'snorlax',
        title: '잠만보 카페',
        description: '가장 깊은 밤, 나디르에서 마주하는 당신만의 평온한 조각',
        tags: [
            { icon: '🌙', text: '평온함' },
            { icon: '🌙', text: '힐링' }
        ],
        url: 'sooviva.com',
        href: 'https://sooviva.com',
        image: '/link/snorlax_card.webp',
        theme: 'dark'
    },
    {
        id: 'ditto',
        title: '메타몽 카페',
        description: '메타몽 바리스타가 선사하는 달콤한 힐링 공간',
        tags: [
            { icon: '🫧', text: '말랑말랑' },
            { icon: '🫧', text: '부드러움' },
            { icon: '🫧', text: '-_-' }
        ],
        url: 'hyeon-j.newlecture.com',
        href: 'https://hyeon-j.newlecture.com',
        image: '/link/ditto_card.webp',
        theme: 'purple'
    },
    {
        id: 'charmander',
        title: '파이리 카페',
        description: '따뜻하게 만든 커피로 몸과 마음을 따뜻하게',
        tags: [
            { icon: '🔥', text: '따뜻함' },
            { icon: '🔥', text: '화산재' },
            { icon: '🔥', text: '불꽃' }
        ],
        url: 'kang.newlecture.com',
        href: 'https://kang.newlecture.com',
        image: '/link/charmander_card.webp',
        theme: 'orange'
    }
];

export default function PartnerSection() {
    return (
        <section className={styles.partnerSection}>
            <div className={styles.container}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={styles.header}
                >
                    <span className={styles.label}>OUR PARTNERS</span>
                    <h2 className={styles.title}>NCafe x Pokemon</h2>
                </motion.div>

                <div className={styles.grid}>
                    {PARTNERS.map((partner, index) => (
                        <motion.a
                            href={partner.badge === '현재 위치' ? undefined : partner.href}
                            target={partner.badge === '현재 위치' ? undefined : "_blank"}
                            rel={partner.badge === '현재 위치' ? undefined : "noopener noreferrer"}
                            className={styles.card}
                            style={THEMES[partner.theme as keyof typeof THEMES] as React.CSSProperties}
                            key={partner.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {partner.badge && (
                                <span className={styles.badge}>{partner.badge}</span>
                            )}
                            <div className={styles.imageWrapper}>
                                <img src={partner.image} alt={partner.title} className={styles.image} />
                            </div>
                            <div className={styles.content}>
                                <h3 className={styles.cardTitle}>{partner.title}</h3>
                                <p className={styles.description}>{partner.description}</p>
                                <div className={styles.tags}>
                                    {partner.tags.map((tag, i) => (
                                        <span key={i} className={styles.tag}>
                                            <span style={{ fontSize: '0.9em' }}>{tag.icon}</span> {tag.text}
                                        </span>
                                    ))}
                                </div>
                                <div className={styles.spacer} />
                                <div className={styles.divider} />
                                <div className={styles.footer}>
                                    <span className={styles.url}>{partner.url}</span>
                                    {partner.badge !== '현재 위치' && (
                                        <span className={styles.visit}>방문하기 ↗</span>
                                    )}
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
