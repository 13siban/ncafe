'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userAPI, userFavoriteAPI } from '@/app/lib/api/userAPI';
import Header from '@/components/common/Header/Header';
import { Footer } from '@/components/common/Footer/Footer';
import styles from './mypage.module.css';

import GradeSection from './_components/GradeSection';
import ProfileSection from './_components/ProfileSection';
import PasswordSection from './_components/PasswordSection';
import OrderHistory from './_components/OrderHistory';
import FavoritesList from './_components/FavoritesList';
import PointSection from './_components/PointSection';
import DeleteAccount from './_components/DeleteAccount';

export default function MyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('membership'); // 'membership', 'orders', 'profile'

    // 프로필 정보 상태
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSocialUser, setIsSocialUser] = useState(false);

    const [favorites, setFavorites] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [topMenus, setTopMenus] = useState<any[]>([]);
    const [gradeInfo, setGradeInfo] = useState<any>(null);
    const [pointData, setPointData] = useState<{ balance: number, history: any[] }>({ balance: 0, history: [] });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 프로필은 반드시 성공해야 함
                const profileData = await userAPI.getProfile();
                setNickname(profileData.nickname || '');
                setEmail(profileData.email || '');
                setPhoneNumber(profileData.phoneNumber || '');
                setIsSocialUser(profileData.username?.startsWith('google_') || false);
            } catch (error: any) {
                alert(error.message || '정보를 불러오는 데 실패했습니다.');
                router.push('/login');
                return;
            }

            // 나머지 데이터는 병렬로 가져오되, 개별 실패 허용
            const [favResult, ordersResult, topMenusResult, gradeResult, pointResult] = await Promise.allSettled([
                userFavoriteAPI.getFavorites(),
                userAPI.getOrders(),
                userAPI.getTopMenus(),
                userAPI.getGradeInfo(),
                Promise.all([userAPI.getPointBalance(), userAPI.getPointHistory(0, 20)])
            ]);

            if (favResult.status === 'fulfilled') setFavorites(favResult.value);
            if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
            if (topMenusResult.status === 'fulfilled') setTopMenus(topMenusResult.value);
            if (gradeResult.status === 'fulfilled') setGradeInfo(gradeResult.value);
            if (pointResult.status === 'fulfilled') {
                const [balanceRes, historyRes] = pointResult.value;
                setPointData({
                    balance: balanceRes.pointBalance || 0,
                    history: historyRes.content || []
                });
            }

            setIsLoading(false);
        };

        fetchAllData();
    }, [router]);

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
                            className={`${styles.tabBtn} ${activeTab === 'membership' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('membership')}
                        >
                            등급 및 포인트
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            주문 및 관심 메뉴
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            회원정보 수정
                        </button>
                    </div>
                    <div className={styles.tabContent}>
                        {activeTab === 'membership' && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <GradeSection gradeInfo={gradeInfo} />
                                    <PointSection pointData={pointData} gradeInfo={gradeInfo} view="balance" />
                                </div>
                                <PointSection pointData={pointData} view="history" />
                            </>
                        )}
                        {activeTab === 'orders' && (
                            <>
                                <OrderHistory 
                                    orders={orders} 
                                    topMenus={topMenus} 
                                    favoritesNode={<FavoritesList favorites={favorites} setFavorites={setFavorites} />}
                                />
                            </>
                        )}
                        {activeTab === 'profile' && (
                            <>
                                <ProfileSection
                                    nickname={nickname}
                                    email={email}
                                    phoneNumber={phoneNumber}
                                    setNickname={setNickname}
                                    setEmail={setEmail}
                                    setPhoneNumber={setPhoneNumber}
                                />
                                {!isSocialUser && <PasswordSection />}
                                <DeleteAccount isSocialUser={isSocialUser} />
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
