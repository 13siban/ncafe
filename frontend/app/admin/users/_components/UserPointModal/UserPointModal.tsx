import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/app/lib/api/client';
import styles from './UserPointModal.module.css';

interface PointHistory {
    id: number;
    type: string;
    pointAmount: number;
    balanceSnapshot: number;
    description: string;
    createdAt: string;
}

interface User {
    id: string;
    username: string;
}

interface UserPointModalProps {
    user: User;
    onClose: () => void;
}

export const UserPointModal = ({ user, onClose }: UserPointModalProps) => {
    const [balance, setBalance] = useState<number>(0);
    const [history, setHistory] = useState<PointHistory[]>([]);
    const [amountStr, setAmountStr] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [balanceData, historyData] = await Promise.all([
                fetchAPI(`/admin/users/${user.id}/points`),
                fetchAPI(`/admin/users/${user.id}/points/history`)
            ]);
            setBalance(balanceData.pointBalance || 0);
            setHistory(historyData.content || []);
        } catch (err) {
            console.error('Failed to fetch point data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const handleAdjustPoints = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount === 0) {
            alert('유효한 포인트를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchAPI(`/admin/users/${user.id}/points`, {
                method: 'POST',
                body: JSON.stringify({ amount, description })
            });

            alert('포인트가 성공적으로 변경되었습니다.');
            setAmountStr('');
            setDescription('');
            fetchData();
        } catch (err: any) {
            alert(err.message || '포인트 변경 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2><span style={{ color: '#27ae60' }}>{user.username}</span>님의 포인트 관리</h2>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.content}>
                    <div className={styles.balanceSection}>
                        <h3>현재 잔액: <span className={styles.balance}>{new Intl.NumberFormat('ko-KR').format(balance)} P</span></h3>
                    </div>

                    <form className={styles.formSection} onSubmit={handleAdjustPoints}>
                        <h4>포인트 지급/차감</h4>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                placeholder="포인트 (음수는 차감)"
                                value={amountStr}
                                onChange={(e) => setAmountStr(e.target.value)}
                                className={styles.input}
                                required
                            />
                            <input
                                type="text"
                                placeholder="사유 (예: 이벤트 참여 보상)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={styles.input}
                                required
                            />
                            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                                적용
                            </button>
                        </div>
                        <p className={styles.hint}>* 차감하려면 음수(예: -500)를 입력하세요.</p>
                    </form>

                    <div className={styles.historySection}>
                        <h4>포인트 내역</h4>
                        {isLoading ? (
                            <div className={styles.loading}>로딩 중...</div>
                        ) : history.length === 0 ? (
                            <div className={styles.empty}>내역이 없습니다.</div>
                        ) : (
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>날짜</th>
                                        <th>유형</th>
                                        <th>사유</th>
                                        <th>변동</th>
                                        <th>잔액</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.id}>
                                            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`${styles.typeBadge} ${styles[item.type.toLowerCase()]}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td>{item.description || '-'}</td>
                                            <td style={{ color: item.pointAmount > 0 ? '#27ae60' : '#e74c3c' }}>
                                                {item.pointAmount > 0 ? '+' : ''}{item.pointAmount}
                                            </td>
                                            <td>{item.balanceSnapshot}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
