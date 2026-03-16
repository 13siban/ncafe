'use client';

import React from 'react';
import styles from '../../mypage.module.css';

interface GradeSectionProps {
    gradeInfo: any;
}

const GradeSection: React.FC<GradeSectionProps> = ({ gradeInfo }) => {
    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>회원 등급</h2>
            {gradeInfo ? (
                gradeInfo.gradeSystemEnabled === false ? (
                    <div className={styles.gradeCard}>
                        <div className={styles.gradeCardHeader}>
                            <div className={styles.gradeName}>기본 등급제 운영중</div>
                            <div className={styles.gradeBenefits}>
                                <span>(기본 {gradeInfo.earnRate}% 적립)</span>
                            </div>
                        </div>
                        <p className={styles.disabledText}>현재 등급 시스템이 비활성화되어 있습니다.</p>
                    </div>
                ) : (
                    <div
                        className={styles.gradeCard}
                        style={{
                            background: gradeInfo.mainColor
                                ? `linear-gradient(135deg, ${gradeInfo.mainColor}, ${gradeInfo.mainColor}cc)`
                                : undefined,
                            color: gradeInfo.textColor || undefined,
                            borderColor: gradeInfo.mainColor || undefined
                        }}
                    >
                        <div className={styles.gradeCardHeader}>
                            <div className={styles.gradeName}>{gradeInfo.currentGradeName}</div>
                            <div className={styles.gradeBenefits}>
                                <span>포인트 {gradeInfo.earnRate}% 적립</span>
                            </div>
                        </div>
                        {gradeInfo.nextGrade ? (
                            <div className={styles.gradeProgressContainer}>
                                <div className={styles.progressLabel}>
                                    <span>다음 등급: {gradeInfo.nextGradeName}</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: gradeInfo.nextGradeRequireAmount
                                                ? `${Math.min(100, (gradeInfo.currentOrderAmount / gradeInfo.nextGradeRequireAmount) * 100)}%`
                                                : '100%',
                                            backgroundColor: gradeInfo.mainColor || undefined
                                        }}
                                    />
                                </div>
                                <div className={styles.nextGradeInfo}>
                                    <span>주문 금액: {new Intl.NumberFormat('ko-KR').format(gradeInfo.currentOrderAmount)}원</span>
                                    <span>목표: {gradeInfo.nextGradeRequireAmount ? `${new Intl.NumberFormat('ko-KR').format(gradeInfo.nextGradeRequireAmount)}원` : '달성'}</span>
                                </div>
                                {gradeInfo.nextGradeRequireCount !== null && (
                                    <div className={styles.nextGradeInfo} style={{ marginTop: '4px' }}>
                                        <span>주문 횟수: {gradeInfo.currentOrderCount}회</span>
                                        <span>목표: {gradeInfo.nextGradeRequireCount}회</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.gradeProgressContainer}>
                                <div className={styles.progressLabel}>최고 등급입니다!</div>
                            </div>
                        )}
                    </div>
                )
            ) : (
                <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>상태를 불러오는 중입니다...</p>
            )}
        </section>
    );
};

export default GradeSection;
