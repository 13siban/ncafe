'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchAPI } from '@/app/lib/api/client';
import { useUserActions } from './useUserActions';
import { UserPointModal } from '../UserPointModal/UserPointModal';
import styles from './UserList.module.css';

interface User {
    id: string;
    username: string;
    role: string;
    grade?: string;
    enabled?: boolean;
    deletedAt?: string;
}

const getRoleBadgeClass = (role: string) => {
    if (role === 'ROLE_ADMIN') return styles.roleAdmin;
    if (role === 'ROLE_SUB_ADMIN') return styles.roleSubAdmin;
    return styles.roleUser;
};

const getRoleLabel = (role: string) => {
    if (role === 'ROLE_ADMIN') return '관리자';
    if (role === 'ROLE_SUB_ADMIN') return '부관리자';
    return '일반회원';
};

export const UserList = () => {
    const { user: currentUser } = useAuthStore();
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserForPoints, setSelectedUserForPoints] = useState<User | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAPI('/admin/users');
            setUsers(data);
        } catch (err: any) {
            setError(err.message || '알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const { handleDelete, handleRoleChange, handleGradeChange, handleToggleLock } = useUserActions(fetchUsers);

    if (isLoading) return <div className={styles.loading}>데이터를 불러오는 중입니다...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>닉네임 (Username)</th>
                        <th>역할 (Role)</th>
                        <th>등급 (Grade)</th>
                        <th>상태</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={6} className={styles.empty}>
                                가입된 회원이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>
                                    {isAdmin ? (
                                        <select
                                            className={styles.roleSelect}
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={user.username === currentUser?.username}
                                        >
                                            <option value="ROLE_ADMIN">관리자</option>
                                            <option value="ROLE_SUB_ADMIN">부관리자</option>
                                            <option value="ROLE_USER">일반회원</option>
                                        </select>
                                    ) : (
                                        <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    {isAdmin ? (
                                        <select
                                            className={styles.roleSelect}
                                            value={user.grade || 'GREEN_BEAN'}
                                            onChange={(e) => handleGradeChange(user.id, e.target.value)}
                                        >
                                            <option value="GREEN_BEAN">Green Bean 🌱</option>
                                            <option value="GOLDEN_BROWN">Golden Brown ✨</option>
                                            <option value="DEEP_BROWN">Deep Brown 🫘</option>
                                            <option value="BLACK_ROAST">Black Roast 🖤</option>
                                        </select>
                                    ) : (
                                        <span>{user.grade || 'GREEN_BEAN'}</span>
                                    )}
                                </td>
                                <td>
                                    {user.deletedAt ? (
                                        <span style={{ color: '#e67e22', fontSize: '0.8rem', fontWeight: 600 }}>
                                            🗑️ 탈퇴 요청
                                        </span>
                                    ) : user.enabled === false ? (
                                        <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>
                                            🔒 잠금
                                        </span>
                                    ) : (
                                        <span style={{ color: '#27ae60', fontSize: '0.8rem', fontWeight: 600 }}>
                                            ✅ 활성
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {isAdmin && (
                                        <button
                                            className={styles.pointBtn}
                                            onClick={() => setSelectedUserForPoints(user)}
                                            title="포인트 관리"
                                        >
                                            포인트
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button
                                            className={user.enabled === false ? styles.unlockBtn : styles.lockBtn}
                                            onClick={() => handleToggleLock(user.id)}
                                            disabled={user.username === currentUser?.username}
                                            title={user.enabled === false ? '잠금 해제' : '계정 잠금'}
                                        >
                                            {user.enabled === false ? '🔓' : '🔒'}
                                        </button>
                                    )}
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        삭제
                                    </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {selectedUserForPoints && (
                <UserPointModal
                    user={{ id: selectedUserForPoints.id, username: selectedUserForPoints.username }}
                    onClose={() => setSelectedUserForPoints(null)}
                />
            )}
        </div>
    );
};
