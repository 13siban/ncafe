import React, { Suspense } from 'react';
import SignupForm from '@/components/auth/SignupForm';
import styles from '../login/login.module.css';
import Header from '@/components/common/Header/Header';

export const metadata = {
    title: '회원가입 | mymyy',
    description: 'mymyy에 회원가입 하세요.',
};

const SignupPage = () => {
    return (
        <>
            <Header />
            <div className={styles.splitLayout}>
                <div className={`${styles.leftPanel} ${styles.signupBg}`}>
                    <div className={styles.backgroundDecor}>
                        <div className={`${styles.circle} ${styles.circle1}`} />
                        <div className={`${styles.circle} ${styles.circle2}`} />
                    </div>
                    <div className={styles.placeholderContent}>
                        <h2>Join our Community</h2>
                        <p>특별한 미식 경험의 시작, mymyy와 함께하세요</p>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <main className={styles.pageWrapper}>
                        <div className={styles.content}>
                            <Suspense fallback={<div>로딩 중...</div>}>
                                <SignupForm />
                            </Suspense>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default SignupPage;
