'use client';

import React from 'react';
import { OptionGroupManager } from './_components/OptionGroupManager';
import styles from './page.module.css';

export default function AdminOptionsPage() {
    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>옵션 관리</h1>
            </div>
            <OptionGroupManager />
        </main>
    );
}
