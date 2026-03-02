'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './LoginForm.module.css';
import { authAPI } from '@/app/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // BFF 방식: JWT는 httpOnly 쿠키에 저장되므로 응답에 토큰이 없음
            // 응답: { user: { id, email, nickname, role } }
            const res = await authAPI.login(username, password);

            if (res && res.user) {
                useAuthStore.getState().setUser(res.user);
            }

            // 다른 컴포넌트(Header)에게 로그인 상태 변경 알림
            window.dispatchEvent(new Event('login'));

            // 이전 페이지 또는 홈으로 리다이렉트
            const redirect = searchParams.get('redirect') || '/';
            router.push(redirect);
            router.refresh(); // 서버 컴포넌트 재검증
        } catch (err: any) {
            setError(err.message || '로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.title}>로그인</h1>
            <p className={styles.subtitle}>Welcome back to NCafe</p>

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
            </form>
        </div>
    );
};

export default LoginForm;
