'use client';

import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import styles from './page.module.css';
import { useSettings } from './_components/useSettings';
import { GallerySetting } from './_components/GallerySetting';
import OperatingHoursCard from './_components/OperatingHoursCard';
import CafeInfoCard from './_components/CafeInfoCard';
import ContactCard from './_components/ContactCard';

export default function AdminSettingsPage() {
    const {
        isLoading, isUpdating,
        openTime, closeTime, cafeName, description,
        contactNumber, address, addressEn, faviconUrl, faviconDarkUrl,
        setOpenTime, setCloseTime, setCafeName, setDescription,
        setContactNumber, setAddress, setAddressEn,
        handleUpdateSettings, handleUploadFavicon
    } = useSettings();

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spin} size={40} />
                <p>설정을 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>매장 설정</h1>
                    <p className={styles.subtitle}>카페의 기본 정보와 운영 설정을 관리합니다.</p>
                </div>
                <button className={styles.saveButton} onClick={handleUpdateSettings} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className={styles.spin} size={18} /> : <Save size={18} />}
                    {isUpdating ? '저장 중...' : '변경사항 저장'}
                </button>
            </div>

            <div className={styles.grid}>
                <OperatingHoursCard
                    openTime={openTime} closeTime={closeTime}
                    setOpenTime={setOpenTime} setCloseTime={setCloseTime}
                />
                <CafeInfoCard
                    cafeName={cafeName} description={description}
                    faviconUrl={faviconUrl} faviconDarkUrl={faviconDarkUrl}
                    setCafeName={setCafeName} setDescription={setDescription}
                    onUploadFavicon={handleUploadFavicon}
                />
                <ContactCard
                    contactNumber={contactNumber} address={address} addressEn={addressEn}
                    setContactNumber={setContactNumber} setAddress={setAddress} setAddressEn={setAddressEn}
                />
            </div>
            
            <div style={{ marginTop: '24px' }}>
                <GallerySetting />
            </div>
        </div>
    );
}
