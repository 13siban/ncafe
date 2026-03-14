'use client';

import React from 'react';
import { UserList } from './_components/UserList/UserList';
import styles from './page.module.css';
import { Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>회원 관리</h1>
                <Link href="/admin/grade-settings" className={styles.settingsBtn}>
                    <Settings size={18} /> 등급 설정
                </Link>
            </div>
            <UserList />
        </main>
    );
}
