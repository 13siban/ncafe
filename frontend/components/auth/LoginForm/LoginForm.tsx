'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './LoginForm.module.css';
import { authAPI } from '@/app/lib/api/authAPI';
import { userAPI } from '@/app/lib/api/userAPI';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import DemoLoginModal from '@/components/auth/DemoLoginModal/DemoLoginModal';

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 데모 안내 모달 (방문할 때마다 자동으로 열린다)
    const [showDemoModal, setShowDemoModal] = useState(true);

    // 탈퇴 복구 모달
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [deleteInfo, setDeleteInfo] = useState<{ deletedAt: string; daysRemaining: number } | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    /** 로그인 성공 후 공통 처리 (일반/구글/데모 로그인이 모두 같은 경로를 탄다) */
    const finishLogin = (user: any) => {
        if (user) {
            useAuthStore.getState().setUser(user);
        }
        window.dispatchEvent(new Event('login'));

        let redirect = searchParams.get('redirect') || '/';
        if (redirect.startsWith('/login')) {
            redirect = '/';
        }
        router.push(redirect);
        router.refresh();
    };

    /** 데모(부관리자) 로그인 — 자격증명은 서버에만 있으므로 본문 없이 호출한다 */
    const handleDemoLogin = async () => {
        const res = await fetch('/api/auth/demo', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || '데모 로그인에 실패했습니다.');

        finishLogin(data.user);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await authAPI.login(username, password);

            finishLogin(res?.user);
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.startsWith('ACCOUNT_DELETED|')) {
                const parts = msg.split('|');
                setDeleteInfo({
                    deletedAt: parts[1],
                    daysRemaining: parseInt(parts[2]) || 0
                });
                setShowRestoreModal(true);
                setError('');
            } else {
                setError(msg || '로그인 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (accessToken: string) => {
        setIsLoading(true);
        setError('');
        try {
            if (!accessToken) {
                throw new Error('Google credential not found');
            }

            const res = await authAPI.googleLogin(accessToken);

            if (res?.accountRestored) {
                alert('탈퇴 요청이 취소되어 계정이 복구되었습니다.');
            }

            finishLogin(res?.user);
        } catch (err: any) {
            setError(err.message || '구글 로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            const res = await userAPI.restoreAccount(username, password);
            alert(res.message || '계정이 복구되었습니다.');
            setShowRestoreModal(false);
            setDeleteInfo(null);
        } catch (err: any) {
            alert(err.message || '복구 중 오류가 발생했습니다.');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.title}>로그인</h1>
            <p className={styles.subtitle}>Welcome back to mymyy</p>

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>아이디</label>
                    <input
                        id="username"
                        type="text"
                        className={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="아이디를 입력하세요"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>비밀번호</label>
                    <input
                        id="password"
                        type="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        required
                    />
                </div>

                {error && (
                    <div className={styles.error}>
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading}
                >
                    {isLoading ? '로그인 중...' : '로그인'}
                </button>
                <button
                    type="button"
                    className={styles.demoTrigger}
                    onClick={() => setShowDemoModal(true)}
                >
                    데모 계정으로 둘러보기
                </button>

                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-gray-500)' }}>계정이 없으신가요? </span>
                    <Link href="/signup" style={{ color: 'var(--color-primary-600)', fontWeight: 600, textDecoration: 'underline' }}>
                        회원가입
                    </Link>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--color-gray-400)', marginBottom: '1rem' }}>
                        Or continue with
                    </div>
                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
                        <GoogleLoginButton onGoogleLogin={handleGoogleLogin} isLoading={isLoading} />
                    </GoogleOAuthProvider>
                </div>
            </form>

            {/* 데모 로그인 안내 모달 */}
            <DemoLoginModal
                isOpen={showDemoModal}
                onClose={() => setShowDemoModal(false)}
                onDemoLogin={handleDemoLogin}
            />

            {/* 탈퇴 복구 모달 */}
            {showRestoreModal && deleteInfo && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 style={{ marginBottom: '12px', color: '#e74c3c' }}>⚠️ 탈퇴 요청된 계정</h2>
                        <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.6, marginBottom: '16px' }}>
                            이 계정은 탈퇴 요청된 상태입니다.<br />
                            <strong>탈퇴 요청일:</strong> {new Date(deleteInfo.deletedAt + 'T00:00:00').toLocaleDateString('ko-KR')}<br />
                            <strong>삭제 예정일:</strong> {(() => {
                                const d = new Date(deleteInfo.deletedAt + 'T00:00:00');
                                d.setDate(d.getDate() + 30);
                                return d.toLocaleDateString('ko-KR');
                            })()}<br />
                            <strong>복구 가능 기간:</strong> 탈퇴 요청 후 30일 이내 ({deleteInfo.daysRemaining}일 남음)
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className={styles.restoreBtn}
                                onClick={handleRestore}
                                disabled={isRestoring}
                            >
                                {isRestoring ? '복구 중...' : '🔄 계정 복구'}
                            </button>
                            <button
                                className={styles.modalCloseBtn}
                                onClick={() => { setShowRestoreModal(false); setDeleteInfo(null); }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm;
