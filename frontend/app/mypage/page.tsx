'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userAPI, userFavoriteAPI } from '@/app/lib/api';
import { useCartStore } from '@/store/useCartStore';
import Header from '@/components/common/Header/Header';
import { Footer } from '@/components/common/Footer/Footer';
import styles from './mypage.module.css';

export default function MyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    // 프로필 정보 상태
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // 비밀번호 변경 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [profileMessage, setProfileMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'favorites' | 'topMenus' | 'points'>('profile');

    const [favorites, setFavorites] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [topMenus, setTopMenus] = useState<any[]>([]);
    const [gradeInfo, setGradeInfo] = useState<any>(null);
    const [pointData, setPointData] = useState<{ balance: number, history: any[] }>({ balance: 0, history: [] });

    // 계정 탈퇴 상태
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const fetchProfileAndFavorites = async () => {
            try {
                const profileData = await userAPI.getProfile();
                setNickname(profileData.nickname || '');
                setEmail(profileData.email || '');
                setPhoneNumber(profileData.phoneNumber || '');

                const favData = await userFavoriteAPI.getFavorites();
                setFavorites(favData);

                try {
                    const ordersData = await userAPI.getOrders();
                    setOrders(ordersData);
                } catch {
                    setOrders([]);
                }

                try {
                    const topMenusData = await userAPI.getTopMenus();
                    setTopMenus(topMenusData);
                } catch {
                    setTopMenus([]);
                }

                try {
                    const gradeData = await userAPI.getGradeInfo();
                    setGradeInfo(gradeData);
                } catch {
                    setGradeInfo(null);
                }

                try {
                    const [balanceRes, historyRes] = await Promise.all([
                        userAPI.getPointBalance(),
                        userAPI.getPointHistory(0, 20)
                    ]);
                    setPointData({
                        balance: balanceRes.pointBalance || 0,
                        history: historyRes.content || []
                    });
                } catch {
                    // Ignore point load error
                }
            } catch (error: any) {
                alert(error.message || '정보를 불러오는 데 실패했습니다.');
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileAndFavorites();
    }, [router]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await userAPI.updateProfile({ nickname, email, phoneNumber });
            setProfileMessage(res.message || '프로필이 성공적으로 수정되었습니다.');
            setTimeout(() => setProfileMessage(''), 3000);

            // 전역 세션 업데이트 요청 이벤트를 발생시켜 Header 등을 갱신
            window.dispatchEvent(new Event('login'));
        } catch (error: any) {
            alert(error.message || '프로필 수정 중 오류가 발생했습니다.');
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }

        try {
            const res = await userAPI.updatePassword({ currentPassword, newPassword });
            setPasswordMessage(res.message || '비밀번호가 성공적으로 변경되었습니다.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage(''), 3000);
        } catch (error: any) {
            alert(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
        }
    };

    const handleRemoveFavorite = async (id: number) => {
        if (!window.confirm('이 즐겨찾기를 삭제하시겠습니까?')) return;
        try {
            await userFavoriteAPI.removeFavorite(id);
            setFavorites(prev => prev.filter(f => f.id !== id));
        } catch (error: any) {
            alert(error.message || '삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCleanupUnavailable = async () => {
        const unavailable = favorites.filter(f => !f.orderable);
        if (unavailable.length === 0) return;
        if (!window.confirm(`주문 불가 항목 ${unavailable.length}개를 모두 삭제하시겠습니까?`)) return;
        try {
            await Promise.all(unavailable.map(f => userFavoriteAPI.removeFavorite(f.id)));
            setFavorites(prev => prev.filter(f => f.orderable));
        } catch (error: any) {
            alert(error.message || '삭제 중 오류가 발생했습니다.');
        }
    };

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case 'MENU_DELETED': return { icon: '🚫', text: '메뉴가 삭제되었습니다' };
            case 'MENU_HIDDEN': return { icon: '🔒', text: '숨김 처리된 메뉴입니다' };
            case 'MENU_SOLD_OUT': return { icon: '📦', text: '품절' };
            case 'OPTION_GROUP_DELETED': return { icon: '⚙️', text: '선택한 옵션이 변경되었습니다' };
            case 'OPTION_ITEM_DELETED': return { icon: '⚙️', text: '선택한 옵션이 변경되었습니다' };
            default: return { icon: '⚠️', text: '주문 불가' };
        }
    };

    const handleAddToCart = (fav: any) => {
        if (!fav.orderable) {
            alert(`주문 불가: ${fav.unavailableReason}`);
            return;
        }

        const optionTotalPrice = fav.options.reduce((sum: number, opt: any) => sum + (opt.additionalPrice || 0), 0);

        const cartItem = {
            cartId: `fav-${fav.id}-${Date.now()}`,
            menuId: fav.menuId,
            menuName: fav.menuName,
            menuEngName: fav.menuName,
            imageSrc: fav.imageUrl || 'placeholder.jpg',
            basePrice: fav.basePrice,
            quantity: 1,
            selectedOptions: fav.options.map((opt: any) => ({
                optionGroupId: opt.optionGroupId,
                optionGroupName: opt.optionGroupName,
                optionItemId: opt.optionItemId,
                optionItemName: opt.optionItemName,
                priceDelta: opt.additionalPrice || 0
            })),
            optionTotalPrice,
            subtotal: fav.basePrice + optionTotalPrice
        };

        useCartStore.getState().addItem(cartItem);
        alert('장바구니에 즐겨찾기 메뉴가 담겼습니다.');
    };

    if (isLoading) {
        return (
            <div className={styles.pageWrapper}>
                <Header />
                <div className={styles.loading}>정보를 불러오는 중입니다...</div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <Header />
            <div className={styles.container}>
                <div className={styles.content}>
                    <h1 className={styles.title}>마이페이지</h1>

                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >프로필</button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >주문 내역</button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'favorites' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >즐겨찾기</button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'topMenus' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('topMenus')}
                        >자주 주문한 메뉴</button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'points' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('points')}
                        >포인트</button>
                    </div>

                    <div className={styles.tabContent}>
                        {activeTab === 'profile' && (
                            <>
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>회원 등급</h2>
                                    {gradeInfo ? (
                                        gradeInfo.gradeSystemEnabled === false ? (
                                            <div className={styles.gradeCard}>
                                                <div className={styles.gradeCardHeader}>
                                                    <div className={styles.gradeName}>기본 등급제 운영중</div>
                                                    <div className={styles.gradeBenefits}>
                                                        <span>(기본 {gradeInfo.earnRate}% 적립)</span>
                                                    </div>
                                                </div>
                                                <p className={styles.disabledText}>현재 등급 시스템이 비활성화되어 있습니다.</p>
                                            </div>
                                        ) : (
                                            <div
                                                className={styles.gradeCard}
                                                style={{
                                                    background: gradeInfo.mainColor
                                                        ? `linear-gradient(135deg, ${gradeInfo.mainColor}, ${gradeInfo.mainColor}cc)`
                                                        : undefined,
                                                    color: gradeInfo.textColor || undefined,
                                                    borderColor: gradeInfo.mainColor || undefined
                                                }}
                                            >
                                                <div className={styles.gradeCardHeader}>
                                                    <div className={styles.gradeName}>{gradeInfo.currentGradeName}</div>
                                                    <div className={styles.gradeBenefits}>
                                                        <span>포인트 {gradeInfo.earnRate}% 적립</span>
                                                    </div>
                                                </div>
                                                {gradeInfo.nextGrade ? (
                                                    <>
                                                        <div className={styles.gradeProgressContainer}>
                                                            <div className={styles.progressLabel}>
                                                                <span>다음 등급: {gradeInfo.nextGradeName}</span>
                                                            </div>
                                                            <div className={styles.progressBar}>
                                                                <div
                                                                    className={styles.progressFill}
                                                                    style={{
                                                                        width: gradeInfo.nextGradeRequireAmount
                                                                            ? `${Math.min(100, (gradeInfo.currentOrderAmount / gradeInfo.nextGradeRequireAmount) * 100)}%`
                                                                            : '100%',
                                                                        backgroundColor: gradeInfo.mainColor || undefined
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className={styles.nextGradeInfo}>
                                                            <span>주문 금액: {new Intl.NumberFormat('ko-KR').format(gradeInfo.currentOrderAmount)}원</span>
                                                            <span>목표: {gradeInfo.nextGradeRequireAmount ? `${new Intl.NumberFormat('ko-KR').format(gradeInfo.nextGradeRequireAmount)}원` : '달성'}</span>
                                                        </div>
                                                        {gradeInfo.nextGradeRequireCount !== null && (
                                                            <div className={styles.nextGradeInfo} style={{ marginTop: '4px' }}>
                                                                <span>주문 횟수: {gradeInfo.currentOrderCount}회</span>
                                                                <span>목표: {gradeInfo.nextGradeRequireCount}회</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className={styles.gradeProgressContainer}>
                                                        <div className={styles.progressLabel}>최고 등급입니다!</div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>상태를 불러오는 중입니다...</p>
                                    )}
                                </section>

                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>개인정보 수정</h2>
                                    <form onSubmit={handleProfileUpdate} className={styles.form}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="nickname">닉네임</label>
                                            <input
                                                id="nickname"
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="email">이메일</label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="phoneNumber">전화번호</label>
                                            <input
                                                id="phoneNumber"
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                        </div>
                                        {profileMessage && <div className={styles.successMessage}>{profileMessage}</div>}
                                        <button type="submit" className={styles.submitBtn}>저장하기</button>
                                    </form>
                                </section>

                                <hr className={styles.divider} />

                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>비밀번호 변경</h2>
                                    <form onSubmit={handlePasswordUpdate} className={styles.form}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="currentPassword">현재 비밀번호</label>
                                            <input
                                                id="currentPassword"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="newPassword">새 비밀번호</label>
                                            <input
                                                id="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="confirmPassword">비밀번호 확인</label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        {passwordMessage && <div className={styles.successMessage}>{passwordMessage}</div>}
                                        <button type="submit" className={styles.submitBtn}>비밀번호 변경</button>
                                    </form>
                                </section>

                                <hr className={styles.divider} />

                                <section className={`${styles.section} ${styles.dangerSection}`}>
                                    <h2 className={styles.sectionTitle} style={{ color: '#e74c3c' }}>⚠️ 계정 탈퇴</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: '16px', lineHeight: 1.6 }}>
                                        탈퇴 후 30일 이내에 로그인하면 계정을 복구할 수 있습니다.<br />
                                        30일이 지나면 계정과 모든 데이터가 영구적으로 삭제됩니다.
                                    </p>
                                    {!showDeleteConfirm ? (
                                        <button
                                            className={styles.dangerBtn}
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            계정 탈퇴 요청
                                        </button>
                                    ) : (
                                        <div className={styles.deleteConfirmBox}>
                                            <p style={{ fontWeight: 600, marginBottom: '12px', color: '#e74c3c' }}>
                                                정말 탈퇴하시겠습니까? 비밀번호를 입력해주세요.
                                            </p>
                                            <input
                                                type="password"
                                                placeholder="현재 비밀번호 입력"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                className={styles.deleteInput}
                                            />
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <button
                                                    className={styles.dangerBtn}
                                                    onClick={async () => {
                                                        if (!deletePassword) {
                                                            alert('비밀번호를 입력해주세요.');
                                                            return;
                                                        }
                                                        try {
                                                            const res = await userAPI.deleteAccount(deletePassword);
                                                            alert(res.message || '탈퇴 요청이 처리되었습니다.');
                                                            // 로그아웃 처리
                                                            window.location.href = '/login';
                                                        } catch (error: any) {
                                                            alert(error.message || '탈퇴 요청 중 오류가 발생했습니다.');
                                                        }
                                                    }}
                                                >
                                                    탈퇴 확인
                                                </button>
                                                <button
                                                    className={styles.cancelBtn}
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false);
                                                        setDeletePassword('');
                                                    }}
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                        {activeTab === 'orders' && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>주문 내역</h2>
                                <div className={styles.orderList}>
                                    {orders.length === 0 ? (
                                        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                                            주문 내역이 없습니다.
                                        </p>
                                    ) : (
                                        orders.map(order => (
                                            <div
                                                key={order.id}
                                                className={styles.orderCard}
                                                onClick={() => router.push(`/order/${order.orderDate}/${order.orderNumber}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className={styles.cardHeader}>
                                                    <div className={styles.dateInfo}>
                                                        <div className={styles.date}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className={styles.displayNumber}>{order.displayNumber}</div>
                                                    </div>
                                                    <div className={styles.statusBadge}>
                                                        {order.status}
                                                    </div>
                                                </div>
                                                <div className={styles.cardBody}>
                                                    <div className={styles.summary}>{order.summary}</div>
                                                    <div className={styles.totalPrice}>{new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === 'favorites' && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>즐겨찾기 메뉴</h2>

                                {/* 주문 불가 항목 배너 */}
                                {favorites.filter(f => !f.orderable).length > 0 && (
                                    <div className={styles.unavailableBanner}>
                                        <span>⚠️ {favorites.filter(f => !f.orderable).length}개의 주문 불가 항목이 있습니다</span>
                                        <button className={styles.cleanupBtn} onClick={handleCleanupUnavailable}>
                                            일괄 삭제
                                        </button>
                                    </div>
                                )}

                                <div className={styles.favoriteList}>
                                    {favorites.length === 0 ? (
                                        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                                            즐겨찾기한 메뉴가 없습니다.
                                        </p>
                                    ) : (
                                        favorites.map(fav => {
                                            const reason = !fav.orderable ? getReasonLabel(fav.unavailableReason) : null;
                                            return (
                                                <div
                                                    key={fav.id}
                                                    className={`${styles.favoriteCard} ${!fav.orderable ? styles.favoriteCardUnavailable : ''}`}
                                                >
                                                    <img
                                                        src={`/images/${fav.imageUrl || 'placeholder.jpg'}`}
                                                        alt={fav.menuName}
                                                        className={styles.favoriteImg}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                                        }}
                                                    />
                                                    <div className={styles.favoriteInfo}>
                                                        <div className={styles.favoriteMenuName}>
                                                            {fav.alias ? `${fav.alias} (${fav.menuName})` : fav.menuName}
                                                        </div>
                                                        <div className={styles.favoriteOptionTags}>
                                                            {fav.options.map((opt: any, idx: number) => (
                                                                <span key={idx} className={styles.tag}>
                                                                    {opt.optionGroupName}: {opt.optionItemName}
                                                                    {opt.additionalPrice > 0 ? ` (+${opt.additionalPrice}원)` : ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {reason ? (
                                                            <div className={styles.reasonBadge}>
                                                                {reason.icon} {reason.text}
                                                            </div>
                                                        ) : (
                                                            <div className={styles.favoritePrice}>
                                                                {new Intl.NumberFormat('ko-KR').format(fav.totalPrice)}원
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={styles.favoriteActions}>
                                                        <button
                                                            className={styles.cartBtn}
                                                            onClick={() => handleAddToCart(fav)}
                                                            disabled={!fav.orderable}
                                                            title={reason ? reason.text : ''}
                                                        >
                                                            장바구니 담기
                                                        </button>
                                                        <button
                                                            className={styles.deleteBtn}
                                                            onClick={() => handleRemoveFavorite(fav.id)}
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === 'topMenus' && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>자주 주문한 메뉴 Top 5</h2>
                                <div className={styles.topMenuList}>
                                    {topMenus.length === 0 ? (
                                        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                                            주문 기록이 없습니다.
                                        </p>
                                    ) : (
                                        topMenus.map((topMenu, idx) => (
                                            <div
                                                key={topMenu.menuId}
                                                className={styles.topMenuCard}
                                                onClick={() => router.push(`/menus/${topMenu.engName ? topMenu.engName.toLowerCase().replace(/\s+/g, '-') : topMenu.menuId}`)}
                                            >
                                                <div className={styles.topMenuRank}>{idx + 1}</div>
                                                <img 
                                                    src={`/images/${topMenu.imageUrl || 'placeholder.jpg'}`}
                                                    alt={topMenu.menuName}
                                                    className={styles.topMenuImg}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                                    }}
                                                />
                                                <div className={styles.topMenuInfo}>
                                                    <div className={styles.topMenuName}>{topMenu.menuName}</div>
                                                    <div className={styles.topMenuCount}>주문 횟수: {topMenu.totalQuantity}회</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === 'points' && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>내 포인트</h2>

                                <div className={styles.gradeCard} style={{ background: gradeInfo?.mainColor ? `linear-gradient(135deg, ${gradeInfo.mainColor}, ${gradeInfo.mainColor}dd)` : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))', color: gradeInfo?.textColor || 'white', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
                                        <span style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>사용 가능 포인트</span>
                                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>{new Intl.NumberFormat('ko-KR').format(pointData.balance)} <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>P</span></span>
                                        {gradeInfo && (
                                            <span style={{ fontSize: '0.85rem', marginTop: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px' }}>
                                                결제 시 {gradeInfo.earnRate}% 적립
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-gray-800)' }}>포인트 이용 내역</h3>
                                <div className={styles.orderList}>
                                    {pointData.history.length === 0 ? (
                                        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                                            이용 내역이 없습니다.
                                        </p>
                                    ) : (
                                        pointData.history.map((h, i) => (
                                            <div key={i} className={styles.orderCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: '4px' }}>
                                                        {new Date(h.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-gray-800)', fontWeight: 500 }}>
                                                        {h.description}
                                                        {h.orderId && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>(주문 번호: {h.orderId})</span>}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: h.type === 'EARN' || h.type === 'CANCEL' ? 'var(--color-primary-600)' : 'var(--color-danger)' }}>
                                                        {h.type === 'EARN' || h.type === 'CANCEL' ? '+' : '-'}{new Intl.NumberFormat('ko-KR').format(h.pointAmount)}P
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                                                        잔액 {new Intl.NumberFormat('ko-KR').format(h.balanceSnapshot)}P
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
