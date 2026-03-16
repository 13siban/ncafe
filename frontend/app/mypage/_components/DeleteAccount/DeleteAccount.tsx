'use client';

import React, { useState } from 'react';
import { userAPI } from '@/app/lib/api/userAPI';
import styles from '../../mypage.module.css';

interface DeleteAccountProps {
    isSocialUser: boolean;
}

const DeleteAccount: React.FC<DeleteAccountProps> = ({ isSocialUser }) => {
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <section className={`${styles.section} ${styles.dangerSection}`}>
            <h2 className={styles.sectionTitle} style={{ color: '#e74c3c' }}>⚠️ 계정 탈퇴</h2>
            <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: '16px', lineHeight: 1.6 }}>
                탈퇴 후 30일 이내에 로그인하면 계정을 복구할 수 있습니다.<br />
                30일이 지나면 계정과 모든 데이터가 영구적으로 삭제됩니다.
            </p>
            {!showDeleteConfirm ? (
                <button
                    className={styles.dangerBtn}
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    계정 탈퇴 요청
                </button>
            ) : (
                <div className={styles.deleteConfirmBox}>
                    <p style={{ fontWeight: 600, marginBottom: '12px', color: '#e74c3c' }}>
                        {isSocialUser
                            ? '정말 탈퇴하시겠습니까?'
                            : '정말 탈퇴하시겠습니까? 비밀번호를 입력해주세요.'}
                    </p>
                    {!isSocialUser && (
                        <input
                            type="password"
                            placeholder="현재 비밀번호 입력"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className={styles.deleteInput}
                        />
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                            className={styles.dangerBtn}
                            onClick={async () => {
                                if (!isSocialUser && !deletePassword) {
                                    alert('비밀번호를 입력해주세요.');
                                    return;
                                }
                                try {
                                    const res = await userAPI.deleteAccount(isSocialUser ? '' : deletePassword);
                                    alert(res.message || '탈퇴 요청이 처리되었습니다.');
                                    window.location.href = '/login';
                                } catch (error: any) {
                                    alert(error.message || '탈퇴 요청 중 오류가 발생했습니다.');
                                }
                            }}
                        >
                            탈퇴 확인
                        </button>
                        <button
                            className={styles.cancelBtn}
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeletePassword('');
                            }}
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default DeleteAccount;
