'use client';

import React, { useEffect, useState } from 'react';
import styles from './DemoLoginModal.module.css';

interface DemoLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** 데모 로그인 실행. 성공 시 부모가 라우팅까지 처리한다. */
    onDemoLogin: () => Promise<void>;
}

/**
 * 데모 로그인 안내 모달
 *
 * 계정이 없는 방문자(포트폴리오 관람자)가 부관리자 계정으로
 * 바로 서비스를 둘러볼 수 있게 안내한다.
 * 실제 아이디/비밀번호는 서버(/api/auth/demo)에만 있다.
 */
export default function DemoLoginModal({ isOpen, onClose, onDemoLogin }: DemoLoginModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // ESC 키로 닫기
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleClick = async () => {
        setIsLoading(true);
        setError('');
        try {
            await onDemoLogin();
        } catch (err: any) {
            setError(err?.message || '로그인에 실패했습니다.');
            setIsLoading(false);
        }
    };

    return (
        <div
            className={styles.overlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
                <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
                    ×
                </button>

                <h2 id="demo-modal-title" className={styles.title}>처음 오셨나요?</h2>
                <p className={styles.subtitle}>
                    회원가입 없이 아래 계정으로 서비스를 둘러보실 수 있습니다.
                </p>

                <button
                    type="button"
                    className={styles.demoButton}
                    onClick={handleClick}
                    disabled={isLoading}
                >
                    <span className={styles.emoji} aria-hidden="true">🛠️</span>
                    <span className={styles.buttonBody}>
                        <strong className={styles.buttonTitle}>
                            {isLoading ? '접속하는 중...' : '부관리자로 둘러보기'}
                        </strong>
                        <span className={styles.buttonDesc}>
                            관리자 페이지에서 메뉴·주문·통계를 확인할 수 있습니다.
                        </span>
                    </span>
                </button>

                {error && <p className={styles.error} role="alert">{error}</p>}

                <p className={styles.hint}>
                    계정이 있으시다면 닫기 후 직접 로그인해주세요.
                </p>
            </div>
        </div>
    );
}
