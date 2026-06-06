# ☕ mymyy카페 — 카페 온라인 주문 & 매장 관리 플랫폼

> **1인 풀스택 프로젝트** | 기획 · 설계 · 개발 · 배포 전 과정 수행  
> 🔗 **서비스 바로가기**: [https://mymyy.com](https://mymyy.com)

---

## 📌 프로젝트 개요

카페 운영에 필요한 **고객 주문 시스템**(메뉴 조회, 장바구니, 실결제, 주문 추적)과 **관리자 시스템**(대시보드, 메뉴 CRUD, 주문 관리, 매출 분석, 회원 관리)을 하나의 플랫폼으로 구축한 1인 풀스택 프로젝트입니다.

- **개발 기간**: 2026.02 ~ 2026.03 (약 4주)
- **개발 인원**: 1인 (기획 · 설계 · 개발 전담)

---

## 🛠 Tech Stack

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript, Zustand, CSS Modules, Framer Motion |
| **Backend** | Java 21, Spring Boot 4.0, Spring Security, JPA |
| **AI Agent** | Python, FastAPI, Google Gemini API, RAG (Retrieval-Augmented Generation) |
| **Database** | PostgreSQL |
| **Auth** | JWT, Google OAuth 2.0, iron-session |
| **Payment** | PortOne SDK (카카오페이, 네이버페이, 이니시스 카드결제) |
| **Infra** | Docker Compose, Nginx |

---

## 🏗 시스템 아키텍처

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client     │────▶│   Next.js 16     │────▶│  Spring Boot    │
│  (Browser)   │     │  (BFF Proxy)     │     │  (REST API)     │
└─────────────┘     │                  │     └────────┬────────┘
                    │  - Route Handler │              │
                    │  - iron-session  │              │
                    │  - JWT 포워딩    │     ┌────────▼────────┐
                    └────────┬─────────┘     │   PostgreSQL    │
                             │               └─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  FastAPI Agent   │
                    │  (AI RAG 챗봇)   │
                    │  - Gemini API    │
                    │  - SSE 스트리밍  │
                    └──────────────────┘
```

### 핵심 설계 원칙

- **BFF(Backend-For-Frontend) 프록시 패턴**: 클라이언트가 백엔드 서버와 직접 통신하지 않고, Next.js Route Handler를 통해 인증 정보를 자동 처리하여 민감 정보 노출을 원천 차단
- **역할별 코드 분리**: 메뉴 · 주문 · 회원 · 결제 영역이 서로 간섭하지 않고 독립적으로 유지보수 가능한 구조
- **AI 페어 프로그래밍 최적화**: TypeScript 엄격 타입 정의와 기능별 폴더 구조 표준화로 AI 도구가 코드 맥락을 정확히 파악할 수 있는 아키텍처 설계

---

## ✨ 주요 기능

### 🛒 고객 페이지 (11개)

| 기능 | 설명 |
|------|------|
| **메뉴 조회** | 카테고리별 메뉴 브라우징, 메뉴 상세 정보 및 옵션 선택 |
| **장바구니** | 메뉴 + 선택 옵션 조합별 장바구니 관리, 수량 조절 |
| **실결제** | 카카오페이 · 네이버페이 · 이니시스 카드결제 연동 (PortOne SDK) |
| **주문 추적** | 주문 상태 실시간 확인, 주문 내역 조회 |
| **회원 시스템** | 회원/비회원 주문 분기, Google OAuth 로그인, 포인트 차감 결제 |
| **AI 챗봇** | 자연어 메뉴 추천, 장바구니 추가, 주문 조회 (실시간 스트리밍 응답) |
| **마이페이지** | 주문 이력, 포인트 현황, 등급 확인 |

### ⚙️ 관리자 페이지 (12개)

| 기능 | 설명 |
|------|------|
| **대시보드** | 일간/주간/월간 매출 분석, 주요 KPI 요약 |
| **메뉴 관리** | 메뉴 CRUD, 카테고리 관리, 이미지 업로드 |
| **옵션 관리** | 옵션 그룹/항목 CRUD, 메뉴별 옵션 연결 |
| **주문 관리** | 실시간 주문 접수, 상태 변경 |
| **매출 분석** | 메뉴별 판매 랭킹, 기간별 매출 통계 (Recharts) |
| **회원 관리** | 회원 등급/포인트 관리, 회원 검색 |
| **공지 팝업** | 공지 팝업 등록/관리 |
| **RAG 관리** | AI 챗봇 지식 데이터 업로드 및 관리 |
| **매장 설정** | 운영 시간, 매장 정보 설정 |

---

## 📁 프로젝트 구조

```
ncafe/
├── frontend/           # Next.js 16 (TypeScript)
│   ├── app/            # App Router 기반 페이지
│   │   ├── _components/  # 공통 컴포넌트
│   │   ├── admin/        # 관리자 페이지 (12개)
│   │   ├── menus/        # 메뉴 조회
│   │   ├── cart/         # 장바구니
│   │   ├── order/        # 주문/결제
│   │   ├── mypage/       # 마이페이지
│   │   ├── login/        # 로그인
│   │   ├── signup/       # 회원가입
│   │   └── api/          # BFF Route Handlers
│   ├── components/     # 재사용 UI 컴포넌트
│   ├── lib/            # 유틸리티 & API 클라이언트
│   ├── store/          # Zustand 상태 관리
│   ├── types/          # TypeScript 타입 정의
│   └── middleware.ts   # 인증 미들웨어
│
├── backend/            # Spring Boot 4.0 (Java 21)
│   └── src/
│       └── main/java/com/new_cafe/app/
│           ├── controller/   # REST 컨트롤러
│           ├── service/      # 비즈니스 로직
│           ├── repository/   # JPA 레포지토리
│           ├── entity/       # DB 엔티티
│           ├── dto/          # 데이터 전송 객체
│           ├── security/     # JWT & Spring Security
│           └── config/       # 설정 클래스
│
├── agent-server/       # FastAPI (Python)
│   └── app/
│       ├── main.py         # FastAPI 엔트리포인트
│       ├── rag/            # RAG 파이프라인
│       └── gemini/         # Gemini API 연동
│
├── db/                 # PostgreSQL 초기화 스크립트
├── docker-compose.yml  # 4-서비스 오케스트레이션
└── docs/               # 프로젝트 문서
```

---

## 🚀 실행 방법

### 사전 요구 사항

- Docker & Docker Compose
- `.env` 파일 (아래 참고)

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다:

```env
# Docker
COMPOSE_PROJECT_NAME=ncafe
USER_ID=your-user-id

# Database
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret

# Session
SESSION_SECRET=your_session_secret
SESSION_SECURE=false

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# PortOne 결제
NEXT_PUBLIC_PORTONE_STORE_ID=your_store_id
NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY=your_key
NEXT_PUBLIC_PORTONE_NAVERPAY_CHANNEL_KEY=your_key
NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY=your_key

# AI Agent
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

# etc
TZ=Asia/Seoul
FRONTEND_PORT=3000
```

### Docker Compose로 실행

```bash
# 전체 서비스 빌드 및 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f

# 서비스 중지
docker compose down
```

### 로컬 개발 (개별 실행)

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
./gradlew bootRun

# Agent Server
cd agent-server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 🔒 보안 설계

- **BFF 프록시 패턴**: 브라우저 → Next.js Route Handler → Spring Boot. 백엔드 서버의 포트와 엔드포인트가 외부에 직접 노출되지 않음
- **iron-session**: 서버 사이드에서 암호화된 세션 쿠키 관리로 JWT 토큰 보호
- **결제 위변조 방지**: PortOne 결제 완료 후 서버 측에서 금액을 이중 검증하는 로직 구현
- **Spring Security**: JWT 기반 인증 + Google OAuth 2.0 소셜 로그인

---

## 📊 성과

- 1인 개발로 **고객 11페이지 + 관리자 12페이지, 총 23개 페이지** 규모의 서비스를 독립적으로 완성
- **실결제**(카카오페이, 네이버페이, 이니시스)가 동작하는 수준의 완성도
- AI 페어 프로그래밍을 활용하여 구현 시간을 단축하고, 확보된 시간을 **UX 고도화 및 비즈니스 로직 검증**에 집중 투자

---

## 📄 License

This project is for portfolio purposes.

---

**개발자**: 조영일 | 12siban@naver.com
