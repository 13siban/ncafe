'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchAPI } from '@/app/lib/api/client';
import styles from './GradeSection.module.css';

interface GradePublicData {
    grade: string;
    gradeName?: string;
    displayName: string;
    earnRate: number;
    mainColor: string;
    textColor: string;
    upgradeOrderCount: number;
    upgradeOrderAmount: number;
}

export default function GradeSection() {
    const [grades, setGrades] = useState<GradePublicData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGrades = async () => {
            try {
                const data = await fetchAPI('/grades/public', { skipRedirect: true });
                console.log('[GradeSection] API response:', data);
                if (Array.isArray(data) && data.length > 0) {
                    setGrades(data);
                }
                // 빈 배열 = 등급 시스템 비활성 → 섹션 미노출
            } catch (err: any) {
                console.error("[GradeSection] Failed to load public grades:", err?.status, err?.message || err);
            } finally {
                setLoading(false);
            }
        };

        loadGrades();
    }, []);

    // 로딩 중이거나 등급 시스템 비활성(빈 배열)이면 렌더링하지 않음
    if (loading || grades.length === 0) {
        return null;
    }

    return (
        <section className={styles.gradeSection}>
            <motion.h2
                className={styles.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                Membership Tiers
            </motion.h2>
            <motion.p
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
            >
                mymyy를 사랑해주시는 분들을 위해 특별한 혜택을 준비했습니다.<br />
                함께할수록 더 커지는 즐거움을 경험해 보세요.
            </motion.p>

            <div className={styles.grid}>
                {grades.map((grade, index) => (
                    <motion.div
                        key={grade.grade}
                        className={styles.gradeCard}
                        style={{
                            background: grade.mainColor
                                ? `linear-gradient(135deg, ${grade.mainColor}, ${grade.mainColor}cc)`
                                : '#333',
                            color: grade.textColor || '#fff',
                        }}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                    >
                        <div className={styles.gradeHeader} style={{ borderColor: `${grade.textColor}40` }}>
                            <span
                                className={styles.gradeBadge}
                                style={{
                                    backgroundColor: grade.textColor,
                                    color: grade.mainColor
                                }}
                            >
                                {grade.grade}
                            </span>
                            <h3 className={styles.gradeName}>{grade.displayName}</h3>
                        </div>

                        <div className={styles.benefits}>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitLabel}>승급 조건 (주문)</span>
                                <span className={styles.benefitValue}>
                                    {(grade.upgradeOrderCount ?? 0) > 0 ? `${grade.upgradeOrderCount}회 이상` : '기본 등급'}
                                </span>
                            </div>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitLabel}>승급 조건 (금액)</span>
                                <span className={styles.benefitValue}>
                                    {(grade.upgradeOrderAmount ?? 0) > 0 ? `${grade.upgradeOrderAmount!.toLocaleString()}원 이상` : '기본 등급'}
                                </span>
                            </div>
                            <div className={styles.benefitItem} style={{ borderTop: `1px dashed ${grade.textColor}40`, paddingTop: '16px', marginTop: 'auto' }}>
                                <span className={styles.benefitLabel}>결제 적립 혜택</span>
                                <span className={styles.benefitValue} style={{ fontSize: '1.2rem' }}>
                                    {grade.earnRate}%
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
