'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { Coffee, ShoppingCart } from 'lucide-react';
import { authAPI } from '@/app/lib/api';
import { useCartStore } from '@/store/useCartStore';

interface SessionUser {
    id: string;
    email: string;
    nickname: string;
    role: string;
}

const Header = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<SessionUser | null>(null);
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

        // LoginForm 또는 다른 컴포넌트에서 login/logout 이벤트 발생 시 상태 갱신
        const onLogin = () => checkLoginStatus();
        const onLogout = () => setUser(null);

        window.addEventListener('login', onLogin);
        window.addEventListener('logout', onLogout);

        return () => {
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

    return (
        <nav className={styles.nav}>
            <div className={styles.navContainer}>
                <Link href="/" className={styles.logo}>
                    <Coffee size={24} />
                    <span>NCafe</span>
                </Link>
                <div className={styles.navLinks}>
                    <Link href="/menus" className={isActive('/menus') ? styles.active : ''}>Menu</Link>
                    <Link href="/order/my" className={isActive('/order/my') ? styles.active : ''}>My Order</Link>
                    <Link href="/about" className={isActive('/about') ? styles.active : ''}>About</Link>
                    <Link href="/admin" className={isActive('/admin') ? styles.active : ''}>Admin</Link>
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
