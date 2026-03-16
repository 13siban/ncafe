'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginForm.module.css';
import { authAPI } from '@/app/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import Link from 'next/link';

const SignupGoogleButton = ({ onGoogleLogin, isLoading }: { onGoogleLogin: (token: string) => void, isLoading: boolean }) => {
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            onGoogleLogin(tokenResponse.access_token);
        },
        onError: (error) => {
            console.error('Google Login Error:', error);
            alert('구글 로그인에 실패했습니다.');
        }
    });

    return (
        <button
            type="button"
            className={styles.googleButton}
            onClick={() => login()}
            disabled={isLoading}
        >
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Google로 계속하기</span>
        </button>
    );
};

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
                        <SignupGoogleButton onGoogleLogin={handleGoogleLogin} isLoading={isLoading} />
                    </GoogleOAuthProvider>
                </div>
            </form>
        </div>
    );
};

export default SignupForm;
