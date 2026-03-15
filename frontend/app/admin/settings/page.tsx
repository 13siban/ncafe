'use client';

import React from 'react';
import { 
    Clock, 
    Store, 
    Info, 
    Phone, 
    MapPin, 
    Save, 
    Loader2, 
    Globe,
    FileText,
    Settings,
    Sun,
    Moon
} from 'lucide-react';
import styles from './page.module.css';
import { useSettings } from './_components/useSettings';
import { GallerySetting } from './_components/GallerySetting';

export default function AdminSettingsPage() {
    const {
        isLoading,
        isUpdating,
        openTime,
        closeTime,
        cafeName,
        description,
        contactNumber,
        address,
        faviconUrl,
        faviconDarkUrl,
        setOpenTime,
        setCloseTime,
        setCafeName,
        setDescription,
        setContactNumber,
        setAddress,
        handleUpdateSettings,
        handleUploadFavicon
    } = useSettings();

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spin} size={40} />
                <p>설정을 불러오는 중입니다...</p>
            </div>
        );
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isDark: boolean = false) => {
        if (e.target.files && e.target.files[0]) {
            handleUploadFavicon(e.target.files[0], isDark);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>매장 설정</h1>
                    <p className={styles.subtitle}>카페의 기본 정보와 운영 설정을 관리합니다.</p>
                </div>
                <button 
                    className={styles.saveButton}
                    onClick={handleUpdateSettings}
                    disabled={isUpdating}
                >
                    {isUpdating ? <Loader2 className={styles.spin} size={18} /> : <Save size={18} />}
                    {isUpdating ? '저장 중...' : '변경사항 저장'}
                </button>
            </div>

            <div className={styles.grid}>
                {/* 1. Operating Hours Section */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Clock className={styles.cardIcon} size={20} />
                        <h2 className={styles.cardTitle}>영업 시간 설정</h2>
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>오픈 시간</label>
                                <div className={styles.inputWrapper}>
                                    <Clock className={styles.inputIcon} size={16} />
                                    <input 
                                        type="time" 
                                        className={styles.input}
                                        value={openTime}
                                        onChange={(e) => setOpenTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>마감 시간</label>
                                <div className={styles.inputWrapper}>
                                    <Clock className={styles.inputIcon} size={16} />
                                    <input 
                                        type="time" 
                                        className={styles.input}
                                        value={closeTime}
                                        onChange={(e) => setCloseTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Basic Info Section */}
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

                {/* 3. Contact & Address Section */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Info className={styles.cardIcon} size={20} />
                        <h2 className={styles.cardTitle}>연락처 및 위치</h2>
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>대표 전화번호</label>
                            <div className={styles.inputWrapper}>
                                <Phone className={styles.inputIcon} size={16} />
                                <input 
                                    type="tel" 
                                    className={styles.input}
                                    placeholder="02-1234-5678"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>매장 주소</label>
                            <div className={styles.inputWrapper}>
                                <MapPin className={styles.inputIcon} size={16} />
                                <input 
                                    type="text" 
                                    className={styles.input}
                                    placeholder="서울특별시 강남구..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Gallery Settings */}
                <GallerySetting />
            </div>
        </div>
    );
}
