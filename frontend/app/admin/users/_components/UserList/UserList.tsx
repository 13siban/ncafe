'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { apiFetch } from '@/lib/api';
import styles from './UserList.module.css';

interface User {
    id: string;
    username: string;
    role: string;
    grade?: string;
    enabled?: boolean;
    deletedAt?: string;
}

export const UserList = () => {
    const { user: currentUser } = useAuthStore();
    const isAdmin = currentUser?.role === 'ROLE_ADMIN';

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiFetch('/api/admin/users');
            if (!res.ok) {
                throw new Error('회원 목록을 불러오는데 실패했습니다.');
            }
            const data = await res.json();
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

    const handleDelete = async (userId: string) => {
        if (!confirm('정말 이 회원을 삭제하시겠습니까?')) return;

        try {
            const res = await apiFetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('회원 삭제에 실패했습니다.');
            }

            alert('회원이 성공적으로 삭제되었습니다.');
            // 삭제 성공시 목록 갱신
            fetchUsers();
        } catch (err: any) {
            alert(err.message || '회원 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await apiFetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '권한 변경에 실패했습니다.');
            }

            alert('권한이 성공적으로 변경되었습니다.');
            fetchUsers();
        } catch (err: any) {
            alert(err.message || '권한 변경 중 오류가 발생했습니다.');
        }
    };

    const handleGradeChange = async (userId: string, newGrade: string) => {
        try {
            const res = await apiFetch(`/api/admin/users/${userId}/grade`, {
                method: 'PUT',
                body: JSON.stringify({ grade: newGrade })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '등급 변경에 실패했습니다.');
            }

            alert('등급이 성공적으로 변경되었습니다.');
            fetchUsers();
        } catch (err: any) {
            alert(err.message || '등급 변경 중 오류가 발생했습니다.');
        }
    };

    const handleToggleLock = async (userId: string) => {
        try {
            const res = await apiFetch(`/api/admin/users/${userId}/lock`, {
                method: 'PUT',
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '잠금 상태 변경에 실패했습니다.');
            }
            const data = await res.json();
            alert(data.message);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || '잠금 상태 변경 중 오류가 발생했습니다.');
        }
    };

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
                                <td style={{ display: 'flex', gap: '4px' }}>
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
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
