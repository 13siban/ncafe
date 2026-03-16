'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface CartModalProps {
    menuName: string;
    onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ menuName, onClose }) => {
    const router = useRouter();

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>장바구니 추가 완료!</h3>
                <p className={styles.modalDesc}>
                    {menuName}가 장바구니에 담겼습니다.<br />
                    계속 쇼핑하시겠습니까?
                </p>
                <div className={styles.modalButtons}>
                    <button className={styles.primaryBtn} onClick={() => router.push('/cart')}>
                        장바구니로 가기
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => router.push('/menus')}>
                        메뉴 더보기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartModal;
