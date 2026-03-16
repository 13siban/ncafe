'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SignupForm.module.css';
import { authAPI } from '@/app/lib/api/authAPI';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import Link from 'next/link';

const SignupForm = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async (accessToken: string) => {
        setIsLoading(true);
        setError('');
        try {
            if (!accessToken) {
                throw new Error('Google credential not found');
            }

            const res = await authAPI.googleLogin(accessToken);

            if (res && res.user) {
                useAuthStore.getState().setUser(res.user);
            }
            if (res?.accountRestored) {
                alert('탈퇴 요청이 취소되어 계정이 복구되었습니다.');
            }
            window.dispatchEvent(new Event('login'));
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message || '구글 로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);

        try {
            await authAPI.signup(username, password, nickname, email, phoneNumber);
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            router.push('/login');
        } catch (err: any) {
            setError(err.message || '회원가입 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.title}>회원가입</h1>
            <p className={styles.subtitle}>Create a new mymyy account</p>

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>아이디</label>
                    <input
                        id="username"
                        type="text"
                        className={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="새로운 아이디를 입력하세요"
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
                        placeholder="사용할 비밀번호를 입력하세요"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="passwordConfirm" className={styles.label}>비밀번호 확인</label>
                    <input
                        id="passwordConfirm"
                        type="password"
                        className={styles.input}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="비밀번호를 다시 한번 입력하세요"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="nickname" className={styles.label}>닉네임 (표시명)</label>
                    <input
                        id="nickname"
                        type="text"
                        className={styles.input}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="사용할 닉네임을 입력하세요"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>이메일</label>
                    <input
                        id="email"
                        type="email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일을 입력하세요"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="phoneNumber" className={styles.label}>전화번호</label>
                    <input
                        id="phoneNumber"
                        type="tel"
                        className={styles.input}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="010-0000-0000"
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
                    {isLoading ? '가입 중...' : '가입하기'}
                </button>
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-gray-500)' }}>이미 계정이 있으신가요? </span>
                    <Link href="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 600, textDecoration: 'underline' }}>
                        로그인
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
        </div>
    );
};

export default SignupForm;
