import React, { Suspense } from 'react';
import SignupForm from '@/components/auth/SignupForm';
import styles from '../login/login.module.css';
import Header from '@/components/common/Header/Header';

export const metadata = {
    title: '회원가입 | NCafe',
    description: 'NCafe에 회원가입 하세요.',
};

const SignupPage = () => {
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
                        <Suspense fallback={<div>로딩 중...</div>}>
                            <SignupForm />
                        </Suspense>
                    </div>
                </main>
            </div>
        </>
    );
};

export default SignupPage;
