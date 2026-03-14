'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { ShoppingCart } from 'lucide-react';
import { authAPI } from '@/app/lib/api';
import { useCartStore } from '@/store/useCartStore';

interface SessionUser {
    id: string;
    email: string;
    nickname: string;
    role: string;
}

import { Logo } from '../Logo/Logo';

const Header = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<SessionUser | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const cartItemsCount = useCartStore((state) => state.getTotalItems());

    const checkLoginStatus = async () => {
        try {
            // BFF 방식: JWT 없이 세션 쿠키만으로 사용자 정보 조회
            const data = await authAPI.getSession();
            setUser(data?.user || null);
        } catch {
            setUser(null);
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
        const onLogout = () => setUser(null);

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
        window.dispatchEvent(new Event('logout'));
        router.push('/');
        router.refresh(); // 서버 컴포넌트 재검증
    };

    const isHomePage = pathname === '/';
    const isMenuPage = pathname === '/menus';
    const displayScrolled = (!isHomePage && !isMenuPage) || isScrolled;

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
                        <Link href="/admin" className={isActive('/admin') ? styles.active : ''}>Admin</Link>
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
                            <div className={styles.userSection}>
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
                </div>
            </div>
        </nav>
    );
};

export default Header;
