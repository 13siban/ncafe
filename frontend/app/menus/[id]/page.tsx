'use client';

import React, { use } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { ChevronLeft, Loader2, UtensilsCrossed } from 'lucide-react';
import styles from './page.module.css';

import { useMenuDetail } from './_components/useMenuDetail';
import { MenuInfo } from './_components/MenuInfo/MenuInfo';
import { MenuOptions } from './_components/MenuOptions/MenuOptions';
import { Header, Footer } from '@/components/common';
import { userFavoriteAPI, authAPI } from '@/app/lib/api';
import { Star } from 'lucide-react';

export default function PublicMenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    React.useEffect(() => {
        authAPI.getSession().then(data => {
            setIsLoggedIn(!!data?.user);
        }).catch(() => setIsLoggedIn(false));
    }, []);

    const {
        menu,
        optionsData,
        isLoading,
        error,
        isStoreOpen,
        selectedOptions,
        quantity,
        totalPrice,
        isOrderable,
        handleOptionChange,
        handleQuantityChange,
        handleAddToCart
    } = useMenuDetail(id);

    const [showModal, setShowModal] = React.useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);

    const handleAddToCartSuccess = () => {
        const success = handleAddToCart();
        if (success) {
            setShowModal(true);
        }
    };

    const handleAddFavorite = async () => {
        if (!menu) return;

        const alias = window.prompt("즐겨찾기 별칭(예: 연하게 아아)을 입력해주세요. (선택사항)") || undefined;
        
        const mappedOptions: { optionGroupId: number; optionItemId: number }[] = [];
        Object.entries(selectedOptions).forEach(([groupId, itemIds]) => {
            (itemIds as number[]).forEach(itemId => {
                mappedOptions.push({
                    optionGroupId: Number(groupId),
                    optionItemId: Number(itemId),
                });
            });
        });

        try {
            await userFavoriteAPI.addFavorite({
                menuId: menu.id,
                alias,
                selectedOptions: mappedOptions
            });
            alert('즐겨찾기에 성공적으로 추가되었습니다!');
        } catch (err: any) {
            alert(err.message || '로그인 후 이용 가능합니다.');
            router.push('/login');
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

    const imageSrc = menu?.images && menu.images.length > 0 ? menu.images[0].srcUrl : null;

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.container}>
                <button className={styles.backButton} onClick={() => router.push('/menus')}>
                    <ChevronLeft size={20} /> 메뉴 목록으로 돌아가기
                </button>

                <div className={styles.mainContent}>
                    {/* Left Column: Image */}
                    <div className={styles.imageGalleryContainer}>
                        <div 
                            className={styles.imageSection}
                            onClick={() => {
                                if (menu?.images?.length) setIsImageModalOpen(true);
                            }}
                            style={{ cursor: menu?.images?.length ? 'pointer' : 'default' }}
                        >
                            {menu?.images && menu.images.length > 0 ? (
                                <NextImage
                                    src={`/images/${menu.images[selectedImageIndex]?.srcUrl || menu.images[0].srcUrl}`}
                                    alt={menu.korName}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 900px) 100vw, 500px"
                                    priority
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    <UtensilsCrossed size={64} strokeWidth={1} />
                                </div>
                            )}
                        </div>
                        
                        {menu?.images && menu.images.length > 1 && (
                            <div className={styles.thumbnailList}>
                                {menu.images.map((img: any, idx: number) => (
                                    <button 
                                        key={idx}
                                        className={`${styles.thumbnailBtn} ${idx === selectedImageIndex ? styles.activeThumbnail : ''}`}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    >
                                        <NextImage
                                            src={`/images/${img.srcUrl}`}
                                            alt={`${menu.korName} 썸네일 ${idx + 1}`}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Info + Detail Actions */}
                    <div className={styles.rightContent}>
                        <MenuInfo menu={menu} />

                        <div className={styles.detailActions}>
                            <div className={styles.priceDisplay}>
                                {new Intl.NumberFormat('ko-KR').format(menu.price)}원
                            </div>

                            <MenuOptions
                                optionsData={optionsData!}
                                selectedOptions={selectedOptions}
                                onOptionChange={handleOptionChange}
                            />

                            <div className={styles.totalPrice}>
                                ₩ {new Intl.NumberFormat('ko-KR').format(totalPrice)} KRW
                            </div>

                            <div className={styles.orderArea}>
                                <div className={styles.quantityControl}>
                                    <div>
                                        <label className={styles.quantityLabel}>Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                            className={styles.quantityInput}
                                        />
                                    </div>
                                </div>

                                {isLoggedIn && (
                                    <button 
                                        className={styles.favoriteBtn} 
                                        onClick={handleAddFavorite}
                                        title="즐겨찾기 추가"
                                    >
                                        <Star size={24} color="white" fill="white" />
                                    </button>
                                )}

                                <button
                                    className={styles.addToCartBtn}
                                    disabled={!isOrderable || menu.isSoldOut || !isStoreOpen}
                                    onClick={handleAddToCartSuccess}
                                >
                                    {!isStoreOpen ? '영업 종료' : (menu.isSoldOut ? '품절' : 'ADD TO CART')}
                                </button>
                            </div>

                            {!isStoreOpen && (
                                <div className={styles.storeClosedMessage} style={{ marginTop: '10px' }}>
                                    현재 매장 영업 종료로 주문이 불가합니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

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

            {isImageModalOpen && menu?.images && menu.images.length > 0 && typeof document !== 'undefined' && createPortal(
                <div 
                    className={styles.imageModalOverlay}
                    onClick={() => setIsImageModalOpen(false)}
                >
                    <div className={styles.imageModalContent} onClick={e => e.stopPropagation()}>
                        <NextImage
                            src={`/images/${menu.images[selectedImageIndex]?.srcUrl || menu.images[0].srcUrl}`}
                            alt={`${menu.korName} 원본 이미지`}
                            layout="fill"
                            objectFit="contain"
                        />
                        <button 
                            className={styles.closeImageModalBtn}
                            onClick={() => setIsImageModalOpen(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <Footer />
        </div>
    );
}
