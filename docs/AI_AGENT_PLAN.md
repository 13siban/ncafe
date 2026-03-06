# NCafe AI Agent 채팅 구현 계획

## 📌 목표
일반 유저가 NCafe 홈페이지에서 AI Agent와 채팅하며 카페 정보(메뉴, 가격, 카테고리 등)를 얻을 수 있는 기능 구현

---

## 🏗 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                    사용자 브라우저                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  ChatWidget (떠있는 채팅 버블)                  │    │
│  │  ├─ 채팅 메시지 목록                           │    │
│  │  └─ 입력창 + 전송 버튼                         │    │
│  └──────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────┘
                     │ POST /api/chat
                     ▼
┌─────────────────────────────────────────────────────┐
│              Next.js BFF (프론트엔드 서버)             │
│  app/api/chat/route.ts                              │
│  ├─ 세션 기반 대화 히스토리 관리 (메모리)               │
│  ├─ Gemini API 호출 (Phase 2)                       │
│  └─ 시스템 프롬프트에 NCafe 정보 주입 (Phase 3)       │
└─────────────────────────────────────────────────────┘
```

### 왜 BFF(Next.js)에서 Gemini를 호출하는가?

1. **API 키 보안**: Gemini API 키가 브라우저에 노출되지 않음
2. **기존 패턴 유지**: 현재 프로젝트가 BFF 패턴을 사용하고 있으므로 일관성 유지
3. **유연성**: 백엔드(Spring Boot)를 수정하지 않고도 AI 기능 추가 가능
4. **세션 관리**: Next.js 서버에서 대화 히스토리를 간편하게 관리

---

## 🔧 구현 단계

### Phase 1: 더미 응답 + 메모리 기반 채팅 UI ✅
> Gemini API 키 없이도 동작하는 기본 채팅 기능

| 영역 | 파일 | 설명 |
|------|------|------|
| **프론트엔드** | `components/chat/ChatWidget.tsx` | 플로팅 채팅 버블 UI |
| **프론트엔드** | `components/chat/ChatWidget.module.css` | 채팅 위젯 스타일 |
| **BFF API** | `app/api/chat/route.ts` | 채팅 API 엔드포인트 (더미 응답) |
| **상태관리** | `store/useChatStore.ts` | 채팅 상태 관리 (Zustand) |
| **레이아웃** | `app/layout.tsx` 수정 | ChatWidget을 전역에 삽입 |

**동작 방식:**
1. 화면 우하단에 💬 채팅 버블 버튼이 항상 떠 있음
2. 클릭하면 채팅창이 열림
3. 메시지를 보내면 `/api/chat`으로 POST 요청
4. 서버에서 더미 응답 반환 (메모리에 대화 히스토리 저장)
5. 대화 내역은 세션(sessionId) 기반으로 관리

---

### Phase 2: Gemini API 연동 (대기)
> API 키 입력 후, 더미 응답을 Gemini 호출로 교체

- `app/api/chat/route.ts`에서 `@google/generative-ai` SDK 사용
- 시스템 프롬프트에 NCafe 메뉴/카테고리 정보를 미리 주입
- 대화 히스토리를 Gemini에 전달하여 맥락 유지
- 환경변수: `GEMINI_API_KEY`

---

### Phase 3: 실시간 NCafe 데이터 연동 (추후)
> 백엔드 API를 호출하여 실제 메뉴 데이터를 AI에게 제공

- BFF에서 백엔드의 메뉴/카테고리 API를 호출
- 응답 데이터를 Gemini의 컨텍스트에 실시간 주입
- Function Calling으로 메뉴 검색 등 고급 기능 구현 가능

---

## 📂 파일 구조

```
frontend/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          ← 채팅 API (더미 응답 → Gemini)
│   └── layout.tsx                ← ChatWidget 삽입
├── components/
│   └── chat/
│       ├── ChatWidget.tsx        ← 플로팅 채팅 UI 컴포넌트
│       └── ChatWidget.module.css ← 채팅 위젯 스타일
└── store/
    └── useChatStore.ts           ← 채팅 상태 관리 (Zustand)
```
