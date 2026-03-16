'use client';

import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/app/lib/api/client';
import NoticePopupForm from '@/app/admin/notice-popups/_components/NoticePopupForm';

export default function NewNoticePopupPage() {
    const router = useRouter();

    const handleSubmit = async (formData: { title: string; content: string; imageUrl: string; isActive: boolean }) => {
        await fetchAPI('/admin/notice-popups', {
            method: 'POST',
            body: JSON.stringify({
                title: formData.title,
                content: formData.content,
                imageUrl: formData.imageUrl || null,
                isActive: formData.isActive,
            }),
        });
        router.push('/admin/notice-popups');
    };

    return (
        <NoticePopupForm
            pageTitle="새 팝업 작성"
            pageSubtitle="새로운 공지사항 모달을 디자인하세요."
            submitLabel="팝업 저장 및 게시"
            onSubmit={handleSubmit}
            activeLabel="즉시 활성화"
            activeDescription="저장 후 바로 사용자 화면에 노출을 시작합니다."
        />
    );
}
