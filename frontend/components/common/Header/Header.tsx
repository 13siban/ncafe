'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { authAPI } from '@/app/lib/api/authAPI';
import { userAPI } from '@/app/lib/api/userAPI';
import { useCartStore } from '@/store/useCartStore';

interface SessionUser {
    id: string;
    email: string;
    nickname: string;
    role: string;
    grade?: string;
    pointBalance?: number;
}

import { Logo } from '../Logo/Logo';

const Header = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<SessionUser | null>(null);
    const [gradeInfo, setGradeInfo] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const cartItemsCount = useCartStore((state) => state.getTotalItems());

    const checkLoginStatus = async () => {
        try {
            // BFF 방식: JWT 없이 세션 쿠키만으로 사용자 정보 조회
            const data = await authAPI.getSession();
            setUser(data?.user || null);
            if (data?.user) {
                try {
                    const gradeData = await userAPI.getGradeInfo();
                    setGradeInfo(gradeData);
                } catch {
                    setGradeInfo(null);
                }
            } else {
                setGradeInfo(null);
            }
        } catch {
            setUser(null);
            setGradeInfo(null);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        checkLoginStatus();

        const handleScroll = () => {
            if (window.scrollY > window.innerHeight / 2) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // LoginForm 또는 다른 컴포넌트에서 login/logout 이벤트 발생 시 상태 갱신
        const onLogin = () => checkLoginStatus();
        const onLogout = () => {
            setUser(null);
            setGradeInfo(null);
        };

        window.addEventListener('login', onLogin);
        window.addEventListener('logout', onLogout);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('login', onLogin);
            window.removeEventListener('logout', onLogout);
        };
    }, []);

    const isActive = (path: string) => pathname === path;

    const handleLogout = async () => {
        await authAPI.logout();
        setUser(null);
        setGradeInfo(null);
        window.dispatchEvent(new Event('logout'));
        router.push('/');
        router.refresh(); // 서버 컴포넌트 재검증
    };

    const isHomePage = pathname === '/';
    const isMenuPage = pathname === '/menus';
    const isAboutPage = pathname === '/about';
    const displayScrolled = (!isHomePage && !isMenuPage && !isAboutPage) || isScrolled || isMobileMenuOpen;

    return (
        <nav className={`${styles.nav} ${displayScrolled ? styles.scrolled : styles.transparent}`}>
            <div className={styles.navContainer}>
                <Link href="/" className={styles.logo}>
                    <Logo variant={displayScrolled ? 'black' : 'white'} />
                </Link>
                <div className={styles.navLinks}>
                    <Link href="/menus" className={isActive('/menus') ? styles.active : ''}>Menu</Link>
                    <Link href="/order/my" className={isActive('/order/my') ? styles.active : ''}>My Order</Link>
                    <Link href="/about" className={isActive('/about') ? styles.active : ''}>About</Link>
                    {isMounted && user && (
                        <Link href="/mypage" className={isActive('/mypage') ? styles.active : ''}>My Page</Link>
                    )}
                    {isMounted && (user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUB_ADMIN') && (
                        <>
                            <Link href="/admin" className={isActive('/admin') ? styles.active : ''}>Admin</Link>
                            <Link href="/404" className={isActive('/404') ? styles.active : ''}>404</Link>
                        </>
                    )}
                </div>
                <div className={styles.rightSection}>
                    {isMounted && (
                        <Link href="/cart" className={styles.cartIconWrapper}>
                            <ShoppingCart size={24} />
                            {cartItemsCount > 0 && (
                                <span className={styles.cartBadge}>{cartItemsCount}</span>
                            )}
                        </Link>
                    )}
                    <div className={styles.authLinks}>
                        {isMounted && user ? (
                            <div className={styles.userSection} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {gradeInfo && (
                                    <span style={{
                                        background: gradeInfo.mainColor || 'var(--color-primary-600)', color: gradeInfo.textColor || '#fff', 
                                        padding: '2px 8px', borderRadius: '12px', 
                                        fontSize: '0.75rem', fontWeight: 600,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        border: '1px solid white'
                                    }}>
                                        {gradeInfo.icon ? `${gradeInfo.icon} ` : ''}{gradeInfo.currentGradeName}
                                    </span>
                                )}
                                
                                {user.pointBalance !== undefined && (
                                    <span style={{
                                        fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-600)',
                                        marginRight: '8px'
                                    }}>
                                        {user.pointBalance.toLocaleString()} P
                                    </span>
                                )}

                                <span className={styles.username}>{user.nickname}님</span>
                                <button onClick={handleLogout} className={styles.logoutButton}>
                                    Logout
                                </button>
                            </div>
                        ) : isMounted ? (
                            <>
                                <Link href="/login" className={styles.loginButton}>
                                    Login
                                </Link>
                                <Link href="/signup" className={styles.signupButton}>
                                    Sign Up
                                </Link>
                            </>
                        ) : null}
                    </div>
                    {/* 햄버거 메뉴 모바일 버튼 */}
                    <button 
                        className={styles.mobileMenuButton} 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="메뉴 열기/닫기"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
            
            {/* 모바일 다운 메뉴 Ovely */}
            {isMobileMenuOpen && (
                <div className={styles.mobileMenuOverlay}>
                    <Link href="/menus" className={isActive('/menus') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>Menu</Link>
                    <Link href="/order/my" className={isActive('/order/my') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>My Order</Link>
                    <Link href="/about" className={isActive('/about') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                    {isMounted && user && (
                        <Link href="/mypage" className={isActive('/mypage') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>My Page</Link>
                    )}
                    {isMounted && (user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUB_ADMIN') && (
                        <>
                            <Link href="/admin" className={isActive('/admin') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>Admin</Link>
                            <Link href="/404" className={isActive('/404') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>404</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Header;
