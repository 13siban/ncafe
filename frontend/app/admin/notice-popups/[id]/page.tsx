'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAPI } from '@/app/lib/api/client';
import NoticePopupForm from '@/app/admin/notice-popups/_components/NoticePopupForm';

export default function EditNoticePopupPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [initialData, setInitialData] = useState<{ title: string; content: string; imageUrl: string; isActive: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const data = await fetchAPI('/admin/notice-popups');
                if (Array.isArray(data)) {
                    const popup = data.find((p: any) => p.id === parseInt(id));
                    if (popup) {
                        setInitialData({
                            title: popup.title || '',
                            content: popup.content || '',
                            imageUrl: popup.imageUrl || '',
                            isActive: popup.isActive || false,
                        });
                    }
                }
            } catch (e) {
                console.error(e);
                alert('데이터를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, [id]);

    const handleSubmit = async (formData: { title: string; content: string; imageUrl: string; isActive: boolean }) => {
        await fetchAPI(`/admin/notice-popups/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                title: formData.title,
                content: formData.content,
                imageUrl: formData.imageUrl || null,
                isActive: formData.isActive,
            }),
        });
        router.push('/admin/notice-popups');
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;
    }

    return (
        <NoticePopupForm
            pageTitle="공지 팝업 수정"
            pageSubtitle="기존 공지사항의 내용을 변경하고 미리 볼 수 있습니다."
            initialData={initialData || undefined}
            submitLabel="변경사항 저장"
            onSubmit={handleSubmit}
            activeLabel="활성화 유지"
            activeDescription="체크 해제 시 즉시 사용자 화면에서 내려갑니다."
        />
    );
}
