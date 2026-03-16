'use client';

import React, { useState } from 'react';
import { userAPI } from '@/app/lib/api/userAPI';
import styles from '../../mypage.module.css';

const PasswordSection: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        // 새 비밀번호 강도 검사
        if (newPassword.length < 8) {
            setPasswordError('새 비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
            setPasswordError('새 비밀번호는 영문과 숫자를 모두 포함해야 합니다.');
            return;
        }

        // 현재 비밀번호와 새 비밀번호 동일 여부
        if (currentPassword === newPassword) {
            setPasswordError('현재 비밀번호와 새 비밀번호가 동일합니다.');
            return;
        }

        // 비밀번호 확인 일치 여부
        if (newPassword !== confirmPassword) {
            setPasswordError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
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
            setPasswordError(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
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
                {passwordError && <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>⚠️ {passwordError}</div>}
                {passwordMessage && <div className={styles.successMessage}>{passwordMessage}</div>}
                <button type="submit" className={styles.submitBtn}>비밀번호 변경</button>
            </form>
        </section>
    );
};

export default PasswordSection;
