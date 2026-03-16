'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import styles from '../../page.module.css';

interface Doc {
    id: number;
    filename: string;
    content: string;
    metadata: any;
    created_at: string;
    similarity?: number;
}

const SearchPlayground: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Doc[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/vector/search`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery, limit: 3, threshold: 0.1 })
            });
            if (res.ok) { const data = await res.json(); setSearchResults(data); }
        } catch (error) { console.error('Search error:', error); }
        finally { setSearching(false); }
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.sectionTitle}><Search size={20} /> RAG 테스트 플레이그라운드</h2>
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
                            <div className={styles.resultContent}>{result.content.slice(0, 200)}...</div>
                        </div>
                    ))
                ) : (
                    <div className={styles.empty}>검색 결과가 여기에 표시됩니다.</div>
                )}
            </div>
        </div>
    );
};

export default SearchPlayground;
