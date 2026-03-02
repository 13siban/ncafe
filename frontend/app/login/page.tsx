import React, { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import styles from './login.module.css';
import Header from '@/components/common/Header/Header';

export const metadata = {
    title: '로그인 | NCafe',
    description: 'NCafe 관리자 서비스에 로그인하세요.',
};

const LoginPage = () => {
    return (
        <>
            <Header />
            <div style={{ paddingTop: '80px' }}>
                <main className={styles.pageWrapper}>
                    <div className={styles.backgroundDecor}>
                        <div className={`${styles.circle} ${styles.circle1}`} />
                        <div className={`${styles.circle} ${styles.circle2}`} />
                    </div>

                    <div className={styles.content}>
                        {/* useSearchParams()를 사용하는 LoginForm은 Suspense로 감싸야 합니다 */}
                        <Suspense fallback={<div>로딩 중...</div>}>
                            <LoginForm />
                        </Suspense>
                    </div>
                </main>
            </div>
        </>
    );
};

export default LoginPage;
