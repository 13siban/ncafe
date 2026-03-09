'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import styles from './page.module.css';

import { useMenuDetail } from './_components/useMenuDetail';
import { MenuInfo } from './_components/MenuInfo/MenuInfo';
import { MenuOptions } from './_components/MenuOptions/MenuOptions';
import { CartActionBar } from './_components/CartActionBar/CartActionBar';
import { Header, Footer } from '@/components/common';

export default function PublicMenuDetailPage({ params }: { params: Promise<{ id: number }> }) {
    const { id } = use(params);
    const router = useRouter();

    const {
        menu,
        optionsData,
        isLoading,
        error,
        isStoreOpen,
        selectedOptions,
        totalPrice,
        isOrderable,
        handleOptionChange,
        handleAddToCart
    } = useMenuDetail(id);

    const [showModal, setShowModal] = React.useState(false);

    const handleAddToCartSuccess = () => {
        const success = handleAddToCart();
        if (success) {
            setShowModal(true);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.wrapper} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={40} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (error || !menu) {
        return (
            <div className={styles.wrapper}>
                <Header />
                <div className={styles.container} style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <h2 style={{ marginTop: '1rem' }}>오류 발생</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{error || '메뉴를 찾을 수 없습니다.'}</p>
                    <button className={styles.backButton} style={{ marginTop: '2rem' }} onClick={() => router.back()}>
                        <ChevronLeft /> 뒤로 가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.container}>
                <button className={styles.backButton} onClick={() => router.push('/menus')}>
                    <ChevronLeft size={20} /> 메뉴 목록으로 돌아가기
                </button>

                <div className={styles.mainContent}>
                    <MenuInfo menu={menu} />
                    <MenuOptions
                        optionsData={optionsData!}
                        selectedOptions={selectedOptions}
                        onOptionChange={handleOptionChange}
                    />
                </div>
            </main>

            <CartActionBar
                totalPrice={totalPrice}
                isOrderable={isOrderable}
                isSoldOut={menu.isSoldOut}
                isStoreOpen={isStoreOpen}
                isLoading={isLoading}
                onAdd={handleAddToCartSuccess}
            />

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>장바구니 추가 완료!</h3>
                        <p className={styles.modalDesc}>
                            {menu.korName}가 장바구니에 담겼습니다.<br />
                            계속 쇼핑하시겠습니까?
                        </p>
                        <div className={styles.modalButtons}>
                            <button
                                className={styles.primaryBtn}
                                onClick={() => router.push('/cart')}
                            >
                                장바구니로 가기
                            </button>
                            <button
                                className={styles.secondaryBtn}
                                onClick={() => router.push('/menus')}
                            >
                                메뉴 더보기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
