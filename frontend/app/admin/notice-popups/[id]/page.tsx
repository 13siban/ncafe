'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAPI } from '@/app/lib/api';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, LayoutTemplate, Upload, X } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import styles from '../new/form.module.css';

export default function EditNoticePopupPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    isActive: false,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadPopupData();
  }, [id]);

  const loadPopupData = async () => {
    try {
      const data = await fetchAPI('/admin/notice-popups');
      if (Array.isArray(data)) {
        const popup = data.find((p: any) => p.id === parseInt(id));
        if (popup) {
           setFormData({
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
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const data = await fetchAPI('/admin/notice-popups/upload-image', {
        method: 'POST',
        body: fd,
      });
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (err) {
      console.error(err);
      alert('이미지 업로드에 실패했습니다.');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
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
    } catch (error) {
      console.error(error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const getDisplayImageUrl = () => {
    if (imagePreview) return imagePreview;
    if (!formData.imageUrl) return '';
    if (formData.imageUrl.startsWith('http')) return formData.imageUrl;
    return `/api/upload/${formData.imageUrl}`;
  };
  const displayImageUrl = getDisplayImageUrl();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/notice-popups" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className={styles.title}>공지 팝업 수정</h1>
          <p className={styles.subtitle}>기존 공지사항의 내용을 변경하고 미리 볼 수 있습니다.</p>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formBox}>
            <div className={styles.formGroup}>
              <label className={styles.label}>팝업 제목</label>
              <input 
                type="text" required value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                배너 이미지<span className={styles.optionalText}>(선택사항)</span>
              </label>
              {displayImageUrl ? (
                <div className={styles.imagePreviewWrap}>
                  <img src={displayImageUrl} alt="업로드 미리보기" className={styles.imagePreview} />
                  <button type="button" className={styles.imageRemoveBtn} onClick={handleRemoveImage}>
                    <X size={16} />
                  </button>
                  {isUploading && <div className={styles.uploadingOverlay}>업로드 중...</div>}
                </div>
              ) : (
                <div className={styles.dropzone} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={28} />
                  <span>클릭하여 이미지 선택</span>
                  <span className={styles.dropzoneHint}>PNG, JPG, WebP (최대 5MB)</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>본문 내용 (HTML 허용)</label>
              <textarea 
                required rows={6} value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})}
                className={`${styles.input} ${styles.textarea}`}
              />
            </div>

            <div className={styles.checkboxWrap}>
              <label className={styles.checkboxLabel}>
                <div className={styles.checkboxCheck}>
                  <input type="checkbox" checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className={styles.checkbox}
                  />
                </div>
                <div className={styles.checkboxTextWrap}>
                  <span className={styles.checkboxTitle}>활성화 유지</span>
                  <span className={styles.checkboxDesc}>체크 해제 시 즉시 사용자 화면에서 내려갑니다.</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.submitWrap}>
            <Button type="submit" isLoading={isSubmitting} variant="primary" leftIcon={<Save size={18} />}>
              변경사항 저장
            </Button>
          </div>
        </form>

        <div className={styles.previewSticky}>
          <div className={styles.previewHeader}>
            <Eye size={18} className={styles.previewIcon} />
            <span className={styles.previewLabel}>Live Preview</span>
          </div>
          <div className={styles.previewArea}>
            <div className={styles.modalSim}>
              {displayImageUrl ? (
                <div className={styles.modalImgWrap}>
                  <img src={displayImageUrl} alt="preview" className={styles.modalImg} />
                </div>
              ) : (
                <div className={styles.modalImgPlaceholder}>
                  <LayoutTemplate size={32} />
                  <span className={styles.placeholderText}>Image Area</span>
                </div>
              )}
              <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>{formData.title || '제목을 입력하세요'}</h2>
                <div className={styles.modalBody}
                  dangerouslySetInnerHTML={{ __html: formData.content || '<p style="color: #9ca3af; font-style: italic;">내용이 여기에 표시됩니다.</p>' }} 
                />
              </div>
              <div className={styles.modalButtons}>
                <button type="button" className={`${styles.modalBtn} ${styles.modalBtnLeft}`}>오늘 하루 보지 않기</button>
                <button type="button" className={`${styles.modalBtn} ${styles.modalBtnRight}`}>닫기</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
