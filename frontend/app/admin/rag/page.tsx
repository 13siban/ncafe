'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Database, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';
import DocUploadSection from './_components/DocUploadSection';
import SearchPlayground from './_components/SearchPlayground';
import DocumentTable from './_components/DocumentTable';

interface Doc {
    id: number;
    filename: string;
    content: string;
    metadata: any;
    created_at: string;
    similarity?: number;
}

export default function RagManagementPage() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/vector/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocs(data);
            } else {
                const errData = await res.json().catch(() => ({ detail: 'Unknown error' }));
                setError(`서버 오류: ${errData.detail || res.statusText}`);
            }
        } catch {
            setError('에이전트 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocs(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/vector/documents/${id}`, { method: 'DELETE' });
            if (res.ok) setDocs(docs.filter(d => d.id !== id));
        } catch (error) { console.error('Delete error:', error); }
    };

    return (
        <div className={styles.container}>
            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>총 학습 문서</div>
                    <div className={styles.statValue}>{docs.length}</div>
                    <Database size={24} color="#6366f1" style={{ marginTop: 'auto' }} />
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>임베딩 모델</div>
                    <div className={styles.statValue} style={{ fontSize: '1.2rem' }}>e5-small (384d)</div>
                    <Brain size={24} color="#10b981" style={{ marginTop: 'auto' }} />
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>시스템 상태</div>
                    <div className={styles.statValue} style={{ fontSize: '1.2rem', color: '#10b981' }}>정상 동작 중</div>
                    <CheckCircle2 size={24} color="#10b981" style={{ marginTop: 'auto' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <DocUploadSection onUploadComplete={fetchDocs} />
                <SearchPlayground />
            </div>

            <DocumentTable docs={docs} loading={loading} error={error} onDelete={handleDelete} onRefresh={fetchDocs} />
        </div>
    );
}
