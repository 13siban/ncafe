'use client';

import React, { useRef, useState } from 'react';
import { Upload, Edit3, Send, Loader2 } from 'lucide-react';
import styles from '../../page.module.css';

interface DocUploadSectionProps {
    onUploadComplete: () => void;
}

const DocUploadSection: React.FC<DocUploadSectionProps> = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [directTitle, setDirectTitle] = useState('');
    const [directContent, setDirectContent] = useState('');
    const [submittingDirect, setSubmittingDirect] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.txt')) { alert('현재는 .txt 파일만 지원합니다.'); return; }

        setUploading(true);
        try {
            const content = await file.text();
            const res = await fetch(`/api/vector/ingest`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, content, metadata: { size: file.size, type: file.type } })
            });
            if (res.ok) { alert('문서가 성공적으로 업로드되었습니다.'); onUploadComplete(); }
            else { const err = await res.json(); alert(`업로드 실패: ${err.detail}`); }
        } catch { alert('업로드 중 오류가 발생했습니다.'); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleDirectInputSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!directTitle.trim() || !directContent.trim()) { alert('제목과 내용을 모두 입력해 주세요.'); return; }

        setSubmittingDirect(true);
        try {
            const res = await fetch(`/api/vector/ingest`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: directTitle.endsWith('.txt') ? directTitle : `${directTitle}.txt`,
                    content: directContent, metadata: { type: 'manual_input', length: directContent.length }
                })
            });
            if (res.ok) { alert('문서가 성공적으로 등록되었습니다.'); setDirectTitle(''); setDirectContent(''); onUploadComplete(); }
            else { const err = await res.json(); alert(`등록 실패: ${err.detail}`); }
        } catch { alert('등록 중 오류가 발생했습니다.'); }
        finally { setSubmittingDirect(false); }
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.sectionTitle}><Upload size={20} /> 문서 업로드</h2>
            <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 className={styles.uploadIcon} style={{ animation: 'spin 2s linear infinite' }} /> : <Upload className={styles.uploadIcon} />}
                <p style={{ fontWeight: 500 }}>{uploading ? '벡터 생성 중...' : '클릭하여 TXT 파일 업로드'}</p>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>파일을 선택하면 즉시 벡터화되어 DB에 저장됩니다.</p>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt" onChange={handleFileUpload} />
            </div>

            <div className={styles.divider}>OR</div>

            <h2 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '1rem' }}><Edit3 size={20} /> 직접 내용 입력</h2>
            <form className={styles.directInputForm} onSubmit={handleDirectInputSubmit}>
                <input className={styles.input} placeholder="문서 제목 (예: 커피 제조 가이드)" value={directTitle} onChange={(e) => setDirectTitle(e.target.value)} />
                <textarea className={`${styles.input} ${styles.textarea}`} placeholder="AI가 학습할 내용을 직접 입력하세요..." value={directContent} onChange={(e) => setDirectContent(e.target.value)} rows={5} />
                <button className={styles.button} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={submittingDirect}>
                    {submittingDirect ? <Loader2 size={16} className={styles.spinner} /> : <Send size={16} />}
                    {submittingDirect ? '학습 중...' : '학습 데이터 등록'}
                </button>
            </form>
        </div>
    );
};

export default DocUploadSection;
