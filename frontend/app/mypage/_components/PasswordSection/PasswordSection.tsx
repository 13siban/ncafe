'use client';

import React, { useState } from 'react';
import { userAPI } from '@/app/lib/api/userAPI';
import styles from '../../mypage.module.css';

const PasswordSection: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }

        try {
            const res = await userAPI.updatePassword({ currentPassword, newPassword });
            setPasswordMessage(res.message || '비밀번호가 성공적으로 변경되었습니다.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage(''), 3000);
        } catch (error: any) {
            alert(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
        }
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>비밀번호 변경</h2>
            <form onSubmit={handlePasswordUpdate} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="currentPassword">현재 비밀번호</label>
                    <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="newPassword">새 비밀번호</label>
                    <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword">비밀번호 확인</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {passwordMessage && <div className={styles.successMessage}>{passwordMessage}</div>}
                <button type="submit" className={styles.submitBtn}>비밀번호 변경</button>
            </form>
        </section>
    );
};

export default PasswordSection;
