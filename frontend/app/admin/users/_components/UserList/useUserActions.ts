import { fetchAPI } from '@/app/lib/api/client';

interface User {
    id: string;
    username: string;
    role: string;
    grade?: string;
    enabled?: boolean;
    deletedAt?: string;
}

export const useUserActions = (onRefresh: () => void) => {
    const handleDelete = async (userId: string) => {
        if (!confirm('정말 이 회원을 삭제하시겠습니까?')) return;
        try {
            await fetchAPI(`/admin/users/${userId}`, { method: 'DELETE' });
            alert('회원이 성공적으로 삭제되었습니다.');
            onRefresh();
        } catch (err: any) {
            alert(err.message || '회원 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await fetchAPI(`/admin/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });
            alert('권한이 성공적으로 변경되었습니다.');
            onRefresh();
        } catch (err: any) {
            alert(err.message || '권한 변경 중 오류가 발생했습니다.');
        }
    };

    const handleGradeChange = async (userId: string, newGrade: string) => {
        try {
            await fetchAPI(`/admin/users/${userId}/grade`, {
                method: 'PUT',
                body: JSON.stringify({ grade: newGrade })
            });
            alert('등급이 성공적으로 변경되었습니다.');
            onRefresh();
        } catch (err: any) {
            alert(err.message || '등급 변경 중 오류가 발생했습니다.');
        }
    };

    const handleToggleLock = async (userId: string) => {
        try {
            const data = await fetchAPI(`/admin/users/${userId}/lock`, { method: 'PUT' });
            alert(data.message);
            onRefresh();
        } catch (err: any) {
            alert(err.message || '잠금 상태 변경 중 오류가 발생했습니다.');
        }
    };

    return { handleDelete, handleRoleChange, handleGradeChange, handleToggleLock };
};
