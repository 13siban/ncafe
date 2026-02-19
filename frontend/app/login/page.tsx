import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import styles from './login.module.css';

export const metadata = {
    title: '로그인 | NCafe',
    description: 'NCafe 관리자 서비스에 로그인하세요.',
};

const LoginPage = () => {
    return (
        <main className={styles.pageWrapper}>
            <div className={styles.backgroundDecor}>
                <div className={`${styles.circle} ${styles.circle1}`} />
                <div className={`${styles.circle} ${styles.circle2}`} />
            </div>

            <div className={styles.content}>
                <LoginForm />
            </div>
        </main>
    );
};

export default LoginPage;
