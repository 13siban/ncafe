'use client';

import React from 'react';
import { Info, Phone, MapPin } from 'lucide-react';
import styles from '../../page.module.css';

interface ContactCardProps {
    contactNumber: string;
    address: string;
    addressEn: string;
    setContactNumber: (v: string) => void;
    setAddress: (v: string) => void;
    setAddressEn: (v: string) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
    contactNumber, address, addressEn, setContactNumber, setAddress, setAddressEn
}) => {
    return (
        <section className={styles.card}>
            <div className={styles.cardHeader}>
                <Info className={styles.cardIcon} size={20} />
                <h2 className={styles.cardTitle}>연락처 및 위치</h2>
            </div>
            <div className={styles.cardContent}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>대표 전화번호</label>
                    <div className={styles.inputWrapper}>
                        <Phone className={styles.inputIcon} size={16} />
                        <input
                            type="tel"
                            className={styles.input}
                            placeholder="02-1234-5678"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>매장 주소</label>
                    <div className={styles.inputWrapper}>
                        <MapPin className={styles.inputIcon} size={16} />
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="서울특별시 강남구..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>매장 영문 주소</label>
                    <div className={styles.inputWrapper}>
                        <MapPin className={styles.inputIcon} size={16} />
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="123, Teheran-ro, Gangnam-gu..."
                            value={addressEn}
                            onChange={(e) => setAddressEn(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactCard;
