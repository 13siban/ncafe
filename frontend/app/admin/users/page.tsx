'use client';

import React from 'react';
import { UserList } from './_components/UserList/UserList';
import styles from './page.module.css';

export default function AdminUsersPage() {
    return (
        <main className={styles.container}>
            <h1 className={styles.title}>회원 관리</h1>
            <UserList />
        </main>
    );
}
