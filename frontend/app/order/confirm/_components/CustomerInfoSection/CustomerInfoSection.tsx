'use client';

import React from 'react';
import { ClipboardList, User, MessageCircle } from 'lucide-react';
import styles from '../../page.module.css';

interface CustomerInfoSectionProps {
    username: string;
    email: string;
    phone: string;
    memo: string;
    isLoggedIn: boolean;
    setUsername: (v: string) => void;
    setEmail: (v: string) => void;
    setPhone: (v: string) => void;
    setMemo: (v: string) => void;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
    username, email, phone, memo, isLoggedIn,
    setUsername, setEmail, setPhone, setMemo
}) => {
    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
                <ClipboardList size={20} /> 주문 정보
            </h2>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    <User size={14} style={{ marginRight: 4 }} /> 주문자
                </label>
                <input
                    type="text"
                    className={styles.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="이름을 입력하세요"
                    disabled={isLoggedIn}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    {isLoggedIn ? '이메일' : '[선택] 이메일 (결제 알림용)'}
                </label>
                <input
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isLoggedIn ? '' : '입력하지 않아도 주문 가능합니다'}
                    disabled={isLoggedIn}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    {isLoggedIn ? '휴대폰 번호' : '[선택] 휴대폰 번호 (결제 알림용)'}
                </label>
                <input
                    type="tel"
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isLoggedIn ? '' : '입력하지 않아도 주문 가능합니다'}
                    disabled={isLoggedIn}
                />
            </div>
            {isLoggedIn && <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 4 }}>회원 정보로 자동 입력되었습니다.</p>}
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    <MessageCircle size={14} style={{ marginRight: 4 }} /> 요청 사항
                </label>
                <textarea
                    className={styles.textarea}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="예) 시럽 적게 넣어주세요, 얼음 많이 주세요"
                />
            </div>
        </div>
    );
};

export default CustomerInfoSection;
