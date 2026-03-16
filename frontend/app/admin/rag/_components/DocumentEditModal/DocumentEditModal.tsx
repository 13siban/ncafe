'use client';

import React, { useState } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import styles from './DocumentEditModal.module.css';

interface Doc {
    id: number;
    filename: string;
    content: string;
    metadata: any;
    created_at: string;
}

interface DocumentEditModalProps {
    doc: Doc;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, filename: string, content: string) => Promise<void>;
}

export default function DocumentEditModal({ doc, isOpen, onClose, onSave }: DocumentEditModalProps) {
    const [filename, setFilename] = useState(doc.filename);
    const [content, setContent] = useState(doc.content);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(doc.id, filename, content);
            onClose();
        } catch (error) {
            console.error('Failed to update document', error);
            alert('업데이트 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <Edit3 size={18} style={{ marginRight: '8px' }} /> 문서 조회 및 수정
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>파일명</label>
                    <input 
                        type="text" 
                        value={filename} 
                        onChange={(e) => setFilename(e.target.value)} 
                        className={styles.input}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>내용</label>
                    <textarea 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.actions}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={isSaving}>취소</button>
                    <button className={styles.btnSave} onClick={handleSave} disabled={isSaving || !filename || !content}>
                        {isSaving ? '저장 중...' : <><Save size={16} /> 저장</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
