'use client';

import React, { useState } from 'react';
import { FileText, Trash2, RefreshCw, AlertCircle, Edit } from 'lucide-react';
import styles from '../../page.module.css';
import DocumentEditModal from '../DocumentEditModal';

interface Doc {
    id: number;
    filename: string;
    content: string;
    metadata: any;
    created_at: string;
    similarity?: number;
}

interface DocumentTableProps {
    docs: Doc[];
    loading: boolean;
    error: string | null;
    onDelete: (id: number) => void;
    onRefresh: () => void;
    onUpdate: (id: number, filename: string, content: string) => Promise<void>;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ docs, loading, error, onDelete, onRefresh, onUpdate }) => {
    const [editingDoc, setEditingDoc] = useState<Doc | null>(null);

    return (
        <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                    <FileText size={20} /> 저장된 벡터 데이터 목록
                </h2>
                <button
                    className={styles.button}
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                    onClick={onRefresh}
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
                        <button className={styles.button} style={{ marginTop: '1rem' }} onClick={onRefresh}>다시 시도</button>
                    </div>
                ) : docs.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>파일명</th>
                                <th>내용 미리보기</th>
                                <th>등록일</th>
                                <th style={{ textAlign: 'center' }}>작업</th>
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
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button className={styles.actionButton} onClick={() => setEditingDoc(doc)} title="조회 및 수정">
                                                <Edit size={18} />
                                            </button>
                                            <button className={styles.actionButton} onClick={() => onDelete(doc.id)} title="삭제">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.empty}>저장된 문서가 없습니다.</div>
                )}
            </div>

            {editingDoc && (
                <DocumentEditModal
                    doc={editingDoc}
                    isOpen={!!editingDoc}
                    onClose={() => setEditingDoc(null)}
                    onSave={onUpdate}
                />
            )}
        </div>
    );
};

export default DocumentTable;
