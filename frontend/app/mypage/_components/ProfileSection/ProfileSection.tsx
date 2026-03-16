'use client';

import React, { useState } from 'react';
import { userAPI } from '@/app/lib/api/userAPI';
import styles from '../../mypage.module.css';

interface ProfileSectionProps {
    nickname: string;
    email: string;
    phoneNumber: string;
    setNickname: (v: string) => void;
    setEmail: (v: string) => void;
    setPhoneNumber: (v: string) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
    nickname, email, phoneNumber,
    setNickname, setEmail, setPhoneNumber
}) => {
    const [profileMessage, setProfileMessage] = useState('');

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await userAPI.updateProfile({ nickname, email, phoneNumber });
            setProfileMessage(res.message || '프로필이 성공적으로 수정되었습니다.');
            setTimeout(() => setProfileMessage(''), 3000);
            window.dispatchEvent(new Event('login'));
        } catch (error: any) {
            alert(error.message || '프로필 수정 중 오류가 발생했습니다.');
        }
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>개인정보 수정</h2>
            <form onSubmit={handleProfileUpdate} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="nickname">닉네임</label>
                    <input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="email">이메일</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="phoneNumber">전화번호</label>
                    <input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
                {profileMessage && <div className={styles.successMessage}>{profileMessage}</div>}
                <button type="submit" className={styles.submitBtn}>저장하기</button>
            </form>
        </section>
    );
};

export default ProfileSection;
