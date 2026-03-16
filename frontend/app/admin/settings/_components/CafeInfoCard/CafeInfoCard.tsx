'use client';

import React from 'react';
import { Store, Globe, FileText, Sun, Moon } from 'lucide-react';
import styles from '../../page.module.css';

interface CafeInfoCardProps {
    cafeName: string;
    description: string;
    faviconUrl: string;
    faviconDarkUrl: string;
    setCafeName: (v: string) => void;
    setDescription: (v: string) => void;
    onUploadFavicon: (file: File, isDark: boolean) => void;
}

const CafeInfoCard: React.FC<CafeInfoCardProps> = ({
    cafeName, description, faviconUrl, faviconDarkUrl,
    setCafeName, setDescription, onUploadFavicon
}) => {
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isDark: boolean = false) => {
        if (e.target.files && e.target.files[0]) {
            onUploadFavicon(e.target.files[0], isDark);
        }
    };

    return (
        <section className={styles.card}>
            <div className={styles.cardHeader}>
                <Store className={styles.cardIcon} size={20} />
                <h2 className={styles.cardTitle}>카페 기본 정보</h2>
            </div>
            <div className={styles.cardContent}>
                <div className={styles.formRow}>
                    {/* Light Mode Favicon */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <Sun size={14} style={{ marginRight: '4px' }} />
                            파비콘 (라이트 모드)
                        </label>
                        <div className={styles.faviconSection}>
                            <div className={styles.faviconPreview}>
                                {faviconUrl ? (
                                    <img src={`/images/${faviconUrl}`} alt="Favicon Light" />
                                ) : (
                                    <div className={styles.noFavicon}>No Icon</div>
                                )}
                            </div>
                            <div className={styles.faviconUpload}>
                                <input
                                    type="file"
                                    id="faviconInput"
                                    accept="image/png,image/x-icon,image/svg+xml"
                                    style={{ display: 'none' }}
                                    onChange={(e) => onFileChange(e, false)}
                                />
                                <label htmlFor="faviconInput" className={styles.uploadBtn}>
                                    이미지 선택
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Dark Mode Favicon */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <Moon size={14} style={{ marginRight: '4px' }} />
                            파비콘 (다크 모드용 화이트)
                        </label>
                        <div className={styles.faviconSection}>
                            <div className={`${styles.faviconPreview} ${styles.darkPreviewBackground}`}>
                                {faviconDarkUrl ? (
                                    <img src={`/images/${faviconDarkUrl}`} alt="Favicon Dark" />
                                ) : (
                                    <div className={styles.noFavicon}>No Icon</div>
                                )}
                            </div>
                            <div className={styles.faviconUpload}>
                                <input
                                    type="file"
                                    id="faviconDarkInput"
                                    accept="image/png,image/x-icon,image/svg+xml"
                                    style={{ display: 'none' }}
                                    onChange={(e) => onFileChange(e, true)}
                                />
                                <label htmlFor="faviconDarkInput" className={styles.uploadBtn}>
                                    이미지 선택
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <p className={styles.uploadHint} style={{ marginBottom: '16px' }}>PNG, ICO, SVG 권장</p>

                <div className={styles.formGroup}>
                    <label className={styles.label}>카페 이름 (사이트 제목)</label>
                    <div className={styles.inputWrapper}>
                        <Globe className={styles.inputIcon} size={16} />
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="예: mymyy cafe"
                            value={cafeName}
                            onChange={(e) => setCafeName(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>카페 서비스 설명 (메타 설명)</label>
                    <div className={styles.inputWrapper}>
                        <FileText className={styles.inputIcon} size={16} />
                        <textarea
                            className={styles.textarea}
                            placeholder="검색 결과 등에 노출될 서비스 설명을 입력하세요."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CafeInfoCard;
