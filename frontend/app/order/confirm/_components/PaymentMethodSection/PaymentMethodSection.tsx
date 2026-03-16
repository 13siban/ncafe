'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import styles from '../../page.module.css';
import { PaymentMethod } from '@/lib/portone';

interface PaymentMethodSectionProps {
    paymentMethod: PaymentMethod;
    setPaymentMethod: (v: PaymentMethod) => void;
}

const PaymentMethodSection: React.FC<PaymentMethodSectionProps> = ({ paymentMethod, setPaymentMethod }) => {
    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
                <CreditCard size={20} /> 결제 수단
            </h2>
            <div className={styles.paymentMethods}>
                <button
                    className={`${styles.paymentButton} ${paymentMethod === "KAKAOPAY" ? styles.selected : ""}`}
                    onClick={() => setPaymentMethod("KAKAOPAY")}
                >
                    <span className={styles.paymentIcon}>💛</span>
                    카카오페이
                </button>
                <button
                    className={`${styles.paymentButton} ${paymentMethod === "NAVERPAY" ? styles.selected : ""}`}
                    onClick={() => setPaymentMethod("NAVERPAY")}
                >
                    <span className={styles.paymentIcon}>💚</span>
                    네이버페이
                </button>
                <button
                    className={`${styles.paymentButton} ${paymentMethod === "INICIS" ? styles.selected : ""}`}
                    onClick={() => setPaymentMethod("INICIS")}
                >
                    <span className={styles.paymentIcon}>💳</span>
                    신용카드
                </button>
            </div>
        </div>
    );
};

export default PaymentMethodSection;
