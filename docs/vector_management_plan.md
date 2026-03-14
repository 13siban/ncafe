# 🚀 벡터 관리 및 RAG 에이전트 시스템 구축 계획서

본 계획서는 `ex04_pgvector_rag_sam.py`의 로컬 임베딩 및 PGVector 저장 로직을 기반으로, 실제 프로젝트에 적용 가능한 **벡터 관리 시스템 및 RAG 에이전트 서버** 구축 방안을 제안합니다.

---

## 1. 시스템 아키텍처 (System Architecture)

시스템은 현대적인 웹 기술 스택을 사용하여 **프리미엄 관리 환경**을 제공합니다.

| 레이어 | 기술 스택 | 주요 역할 |
|:--- |:--- |:--- |
| **Frontend** | Next.js (App Router) | 대시보드 UI, 문서 업로드, 벡터 검색 테스트, 데이터 관리 |
| **Backend API** | FastAPI (Python) | 문서 처리(Chunking), 임베딩 생성, DB 연동, 검색 엔진 |
| **Embedding** | Sentence-Transformers | `intfloat/multilingual-e5-small` 모델 기반 벡터화 |
| **Vector DB** | PostgreSQL + pgvector | 384차원 고밀도 벡터 저장 및 유사도(Cosine) 검색 |

---

## 2. 주요 기능 정의 (Core Features)

### 📂 문서 업로드 및 전처리 (Ingestion)
- **TXT 포맷 전용 (1차)**: 초기 안정성을 위해 `.txt` 파일 업로드만 우선 지원 (추후 PDF, MD 등으로 확장).
- **Smart Chunking**: TXT 문서를 의미 단위로 분할하여 컨텍스트 보존.
- **Auto-Embedding**: 분할된 청크를 E5 모델을 통해 즉시 벡터화 (`passage:` 접두어 활용).

### 🔍 벡터 관리 대시보드 (Management)
- **Vector List View**: 저장된 문서 정보 및 메타데이터 목록 보기.
- **Delete & Re-Index**: 특정 문서 삭제 및 벡터 다시 생성 기능.
- **Storage Metrics**: 현재 저장된 벡터 수 및 DB 상태 모니터링.

### 🧪 RAG 테스트 플레이그라운드 (Search Playground)
- **Query Test**: 질문 입력 시 검색된 문서와 유사도 점수 시각화.
- **Similarity Threshold**: 검색 품질 조절을 위한 유사도 임계값 설정.

---

## 3. 백엔드 구현 상세 (FastAPI)

### 🔑 핵심 API 엔드포인트
```python
# 1. 문서 업로드 및 벡터화
POST /api/vector/ingest
# 2. 벡터 기반 유사도 검색 (RAG 검색 전용)
POST /api/vector/search
# 3. 문서 목록 조회
GET /api/vector/documents
# 4. 특정 문서 삭제
DELETE /api/vector/documents/{id}
```

### 🧠 데이터베이스 스키마 (PostgreSQL)
```sql
CREATE TABLE rag_documents (
    id SERIAL PRIMARY KEY,
    filename TEXT,           -- 원본 파일명
    content TEXT,            -- 텍스트 내용 (Chunk)
    embedding VECTOR(384),   -- E5 임베딩 벡터
    metadata JSONB,          -- 출처, 페이지 번호 등
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. 프론트엔드 디자인 계획 (Next.js)

### 🎨 디자인 테마
- **Glassmorphism**: 세련된 반투명 카드 UI 디자인.
- **Dark Mode First**: 개발자와 관리자를 위한 눈이 편안한 다크 모드 기반.
- **Micro-Animations**: 파일 업로드 시 로딩 애니메이션 및 검색 결과 트랜지션 적용.

### 🖼️ UI 컴포넌트 구성
1.  **Sidebar**: 프로젝트 목록 및 통계.
2.  **Upload Zone**: 드래그 앤 드롭 파일 업로드 섹션.
3.  **Vector Table**: 효율적인 데이터 관리를 위한 그리드 리스트.
4.  **Chat Preview**: RAG 검색 결과를 미리 확인하는 채팅형 인터페이스.

---

## 5. 실행 로드맵 (Execution Roadmap)

### Phase 1: 기반 인프라 구축
- Docker Compose를 이용한 PostgreSQL(pgvector) 환경 구성.
- Python 가상 환경 설정 및 의존성 설치 (CPU 환경 최적화 권장).
- `SentenceTransformer` 로딩 최적화 (FastAPI Startup 시점 로드).

### Phase 2: 에이전트 서버 (API) 개발
- `ex04_pgvector_rag_sam.py` 로직을 FastAPI 클래스화.
- 문서 분할 알고리즘 (`RecursiveCharacterTextSplitter` 등) 적용.

### Phase 3: 관리 페이지 (UI) 개발
- Next.js 기반 대시보드 레이아웃 구축.
- 비동기 파일 업로드 및 검색 API 연동.

### Phase 4: 고도화 및 최적화
- 벡터 인덱스(`HNSW` or `IVFFlat`) 적용을 통한 검색 속도 향상.
- Reranking 엔진 추가 고려 (검색 품질 강화).

---

> [!TIP]
> **성능 및 환경 최적화**: E5 모델은 CPU 기반에서도 우수한 성능을 보여줍니다. GPU가 없는 서버 환경이라면 아래 명령어로 CPU 전용 `torch`를 설치하여 리소스를 최적화하세요.
> `pip install torch --index-url https://download.pytorch.org/whl/cpu`
