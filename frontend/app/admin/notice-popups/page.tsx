'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/app/lib/api';
import Link from 'next/link';
import { Plus, Edit2, Trash2, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import styles from './page.module.css';

interface NoticePopup {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  isActive: boolean;
}

export default function NoticePopupsPage() {
  const [popups, setPopups] = useState<NoticePopup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAPI('/admin/notice-popups');
      setPopups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePopup = async (id: number, title: string) => {
    if (!confirm(`'${title}' 팝업을 정말 삭제하시겠습니까?`)) return;
    try {
      await fetchAPI(`/admin/notice-popups/${id}`, { method: 'DELETE' });
      fetchPopups();
    } catch (error) {
      console.error(error);
    }
  };



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>공지 팝업 관리</h1>
          <p className={styles.subtitle}>사용자 화면에 표시될 이벤트 배너 및 공지사항 팝업을 관리합니다.</p>
        </div>
        <Link href="/admin/notice-popups/new" style={{ textDecoration: 'none' }}>
          <Button leftIcon={<Plus size={18} />} variant="primary">새 팝업 작성</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      ) : popups.length === 0 ? (
        <div className={styles.emptyState}>
          <LayoutGrid className={styles.emptyIcon} size={48} />
          <h3 className={styles.emptyTitle}>등록된 팝업 없음</h3>
          <p className={styles.emptyDesc}>새 팝업을 작성하여 소식을 알려보세요.</p>
          <div className={styles.emptyButtonWrap}>
            <Link href="/admin/notice-popups/new" style={{ textDecoration: 'none' }}>
              <Button leftIcon={<Plus size={18} />}>첫 팝업 만들기</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {popups.map(p => {
            const imgSrc = p.imageUrl?.startsWith('http') ? p.imageUrl : (p.imageUrl ? `/api/upload/${p.imageUrl}` : '');
            return (
            <div key={p.id} className={styles.card}>
              <div className={styles.imageContainer}>
                {imgSrc ? (
                  <img src={imgSrc} alt={p.title} className={styles.cardImage} />
                ) : (
                  <div className={styles.noImage}>
                    <LayoutGrid size={32} style={{ marginBottom: '8px' }} />
                    <span>이미지 없음</span>
                  </div>
                )}
                <div className={styles.statusBadgeWrap}>
                  <span className={`${styles.badge} ${p.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                    {p.isActive ? '노출중' : '숨김'}
                  </span>
                </div>
              </div>
              
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                


                <div className={styles.cardFooter}>
                  <div className={styles.actionButtons}>
                    <Link href={`/admin/notice-popups/${p.id}`}>
                      <button className={styles.iconButton} title="수정">
                        <Edit2 size={16} />
                      </button>
                    </Link>
                    <button onClick={() => deletePopup(p.id, p.title)} className={`${styles.iconButton} ${styles.deleteBtn}`} title="삭제">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className={styles.cardId}>ID: {p.id}</div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
