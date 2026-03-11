'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Brain,
    Upload,
    Search,
    Trash2,
    FileText,
    Database,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    Edit3,
    Send
} from 'lucide-react';
import styles from './page.module.css';

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
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Doc[]>([]);
    const [searching, setSearching] = useState(false);
    const [directTitle, setDirectTitle] = useState('');
    const [directContent, setDirectContent] = useState('');
    const [submittingDirect, setSubmittingDirect] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // const AGENT_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:8000';

    const fetchDocs = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Fetching docs from: /api/vector/documents`);
            const res = await fetch(`/api/vector/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocs(data);
            } else {
                const errData = await res.json().catch(() => ({ detail: 'Unknown error' }));
                setError(`서버 오류: ${errData.detail || res.statusText}`);
            }
        } catch (error) {
            console.error('Failed to fetch docs:', error);
            setError('에이전트 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.txt')) {
            alert('현재는 .txt 파일만 지원합니다.');
            return;
        }

        setUploading(true);
        try {
            const content = await file.text();
            const res = await fetch(`/api/vector/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    content: content,
                    metadata: { size: file.size, type: file.type }
                })
            });

            if (res.ok) {
                alert('문서가 성공적으로 업로드되었습니다.');
                fetchDocs();
            } else {
                const err = await res.json();
                alert(`업로드 실패: ${err.detail}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/vector/documents/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setDocs(docs.filter(d => d.id !== id));
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleDirectInputSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!directTitle.trim() || !directContent.trim()) {
            alert('제목과 내용을 모두 입력해 주세요.');
            return;
        }

        setSubmittingDirect(true);
        try {
            const res = await fetch(`/api/vector/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: directTitle.endsWith('.txt') ? directTitle : `${directTitle}.txt`,
                    content: directContent,
                    metadata: { type: 'manual_input', length: directContent.length }
                })
            });

            if (res.ok) {
                alert('문서가 성공적으로 등록되었습니다.');
                setDirectTitle('');
                setDirectContent('');
                fetchDocs();
            } else {
                const err = await res.json();
                alert(`등록 실패: ${err.detail}`);
            }
        } catch (error) {
            console.error('Direct input error:', error);
            alert('등록 중 오류가 발생했습니다.');
        } finally {
            setSubmittingDirect(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const res = await fetch(`/api/vector/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery,
                    limit: 3,
                    threshold: 0.1
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
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
                {/* Upload Section */}
                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>
                        <Upload size={20} /> 문서 업로드
                    </h2>
                    <div
                        className={styles.uploadZone}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <Loader2 className={styles.uploadIcon} style={{ animation: 'spin 2s linear infinite' }} />
                        ) : (
                            <Upload className={styles.uploadIcon} />
                        )}
                        <p style={{ fontWeight: 500 }}>
                            {uploading ? '벡터 생성 중...' : '클릭하여 TXT 파일 업로드'}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            파일을 선택하면 즉시 벡터화되어 DB에 저장됩니다.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".txt"
                            onChange={handleFileUpload}
                        />
                    </div>

                    <div className={styles.divider}>OR</div>

                    <h2 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '1rem' }}>
                        <Edit3 size={20} /> 직접 내용 입력
                    </h2>
                    <form className={styles.directInputForm} onSubmit={handleDirectInputSubmit}>
                        <input
                            className={styles.input}
                            placeholder="문서 제목 (예: 커피 제조 가이드)"
                            value={directTitle}
                            onChange={(e) => setDirectTitle(e.target.value)}
                        />
                        <textarea
                            className={`${styles.input} ${styles.textarea}`}
                            placeholder="AI가 학습할 내용을 직접 입력하세요..."
                            value={directContent}
                            onChange={(e) => setDirectContent(e.target.value)}
                            rows={5}
                        />
                        <button 
                            className={styles.button} 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            disabled={submittingDirect}
                        >
                            {submittingDirect ? <Loader2 size={16} className={styles.spinner} /> : <Send size={16} />}
                            {submittingDirect ? '학습 중...' : '학습 데이터 등록'}
                        </button>
                    </form>
                </div>

                {/* Search Playground */}
                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>
                        <Search size={20} /> RAG 테스트 플레이그라운드
                    </h2>
                    <div className={styles.searchBox}>
                        <input
                            className={styles.input}
                            placeholder="임베딩 검색을 테스트할 질문을 입력하세요..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className={styles.button} onClick={handleSearch} disabled={searching}>
                            {searching ? '검색 중...' : '검색'}
                        </button>
                    </div>

                    <div className={styles.resultsList}>
                        {searchResults.length > 0 ? (
                            searchResults.map((result, idx) => (
                                <div key={idx} className={styles.resultItem}>
                                    <div className={styles.resultHeader}>
                                        <span style={{ fontWeight: 600, color: '#6366f1' }}>{result.filename}</span>
                                        <span className={`${styles.similarityBadge} ${result.similarity! > 0.8 ? styles.similarityHigh : styles.similarityMed}`}>
                                            우선순위: {(result.similarity! * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className={styles.resultContent}>
                                        {result.content.slice(0, 200)}...
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.empty}>
                                검색 결과가 여기에 표시됩니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Table */}
            <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                        <FileText size={20} /> 저장된 벡터 데이터 목록
                    </h2>
                    <button
                        className={styles.button}
                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                        onClick={fetchDocs}
                    >
                        <RefreshCw size={16} /> 새로고침
                    </button>
                </div>

                <div className={styles.tableContainer}>
                    {loading ? (
                        <div className={styles.empty}>데이터를 불러오는 중...</div>
                    ) : error ? (
                        <div className={styles.empty} style={{ color: '#ef4444' }}>
                            <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                            <p>{error}</p>
                            <button className={styles.button} style={{ marginTop: '1rem' }} onClick={fetchDocs}>
                                다시 시도
                            </button>
                        </div>
                    ) : docs.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>파일명</th>
                                    <th>내용 미리보기</th>
                                    <th>등록일</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((doc) => (
                                    <tr key={doc.id}>
                                        <td>{doc.id}</td>
                                        <td style={{ color: '#6366f1', fontWeight: 500 }}>{doc.filename}</td>
                                        <td>{doc.content.slice(0, 100)}...</td>
                                        <td>{new Date(doc.created_at).toLocaleString()}</td>
                                        <td>
                                            <button className={styles.actionButton} onClick={() => handleDelete(doc.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.empty}>저장된 문서가 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
