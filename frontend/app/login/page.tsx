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
            <div className={styles.splitLayout}>
                <div className={styles.leftPanel}>
                    <div className={styles.backgroundDecor}>
                        <div className={`${styles.circle} ${styles.circle1}`} />
                        <div className={`${styles.circle} ${styles.circle2}`} />
                    </div>
                    <div className={styles.placeholderContent}>
                        <h2>추가 예정</h2>
                        <p>새로운 콘텐츠가 여기에 추가됩니다.</p>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <main className={styles.pageWrapper}>
                        <div className={styles.content}>
                            {/* useSearchParams()를 사용하는 LoginForm은 Suspense로 감싸야 합니다 */}
                            <Suspense fallback={<div>로딩 중...</div>}>
                                <LoginForm />
                            </Suspense>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
