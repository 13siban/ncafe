'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api';
import styles from './NoticePopupModal.module.css';

interface NoticePopup {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
}

/**
 * 공지 팝업 모달 컴포넌트
 * 
 * 로직 정리:
 * - 백엔드에서 활성 팝업 목록(isActive=true & 노출기간 내)을 가져옴
 * - localStorage의 "오늘 하루 보지 않기" 기록을 확인하여 해당 팝업은 제외
 * - 남은 팝업을 하나씩 순서대로 표시
 * 
 * 버튼 동작:
 * - "닫기": 메모리에서만 숨김. 페이지를 새로고침하면 다시 표시됨
 * - "오늘 하루 보지 않기": localStorage에 기록. 내일 0시까지 해당 팝업만 숨김
 */
export default function NoticePopupModal() {
  const [popups, setPopups] = useState<NoticePopup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchPopups();
  }, []);

  const isHiddenForToday = useCallback((popupId: number): boolean => {
    const key = `hidePopup_${popupId}`;
    const hideUntil = localStorage.getItem(key);
    if (hideUntil && new Date().getTime() < parseInt(hideUntil, 10)) {
      return true;
    }
    // 만료된 항목은 정리
    if (hideUntil) {
      localStorage.removeItem(key);
    }
    return false;
  }, []);

  const fetchPopups = async () => {
    try {
      const data = await fetchAPI('/notice-popups/active', { skipRedirect: true });

      if (!Array.isArray(data)) {
        return;
      }

      // "오늘 하루 보지 않기"한 팝업만 제외 (localStorage 기반)
      const visiblePopups = data.filter((p: NoticePopup) => {
        return !isHiddenForToday(p.id);
      });

      setPopups(visiblePopups);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
    }
  };

  if (popups.length === 0 || currentIndex >= popups.length) return null;

  const currentPopup = popups[currentIndex];

  // "닫기" - 메모리에서만 숨김 (새로고침하면 다시 나타남)
  const closePopup = () => {
    setCurrentIndex(prev => prev + 1);
  };

  // "오늘 하루 보지 않기" - localStorage에 내일 0시까지 해당 팝업 ID만 숨김 기록
  const hideForToday = () => {
    const key = `hidePopup_${currentPopup.id}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    localStorage.setItem(key, tomorrow.getTime().toString());
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {currentPopup.imageUrl && (
          <img 
            src={currentPopup.imageUrl.startsWith('http') ? currentPopup.imageUrl : `/api/upload/${currentPopup.imageUrl}`} 
            alt={currentPopup.title} 
            className={styles.image} 
          />
        )}
        <div className={styles.body}>
          <h2 className={styles.title}>{currentPopup.title}</h2>
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: currentPopup.content }} />
        </div>
        <div className={styles.footer}>
          <button onClick={hideForToday} className={`${styles.footerBtn} ${styles.hideBtn}`}>오늘 하루 보지 않기</button>
          <button onClick={closePopup} className={`${styles.footerBtn} ${styles.closeBtn}`}>닫기</button>
        </div>
      </div>
    </div>
  );
}
