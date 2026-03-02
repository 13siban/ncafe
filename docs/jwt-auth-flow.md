# JWT 인증 흐름 완전 분석

> NCafe 프로젝트의 BFF(Backend For Frontend) 패턴 기반 JWT 인증 구조를 코드 레벨에서 설명합니다.

---

## 🔑 로그인 흐름 (단계별 코드 추적)

### 1단계 — 사용자가 로그인 폼 제출

**파일:** `frontend/components/auth/LoginForm.tsx`

```
사용자가 아이디/비밀번호 입력 후 [로그인] 클릭
```

```typescript
// LoginForm.tsx
await authAPI.login(username, password);
//    ↓ 이 호출은 아래로 이어집니다
```

---

### 2단계 — BFF 로그인 API 호출

**파일:** `frontend/app/lib/api.ts` → `frontend/app/api/auth/login/route.ts`

```typescript
// app/lib/api.ts
login: (username, password) =>
  fetchAPI('/auth/login', {      // → 실제 요청: POST /api/auth/login
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
```

이 요청은 **브라우저 → Next.js 서버**로 갑니다 (Spring Boot로 직접 가지 않습니다!).

---

### 3단계 — Next.js 서버가 Spring Boot에 대신 로그인 요청

**파일:** `frontend/app/api/auth/login/route.ts`

```
브라우저가 POST /api/auth/login 호출
    ↓
[Next.js 서버] app/api/auth/login/route.ts 실행
    ↓
① Spring Boot POST http://localhost:8031/auth/login 호출 (서버→서버)
    ↓
② Spring Boot가 JWT 토큰({ token: "eyJ..." }) 반환
    ↓
③ Next.js가 다시 GET http://localhost:8031/auth/me 호출 (JWT를 헤더에 넣어서)
    ↓
④ Spring Boot가 사용자 정보({ nickname, role, ... }) 반환
    ↓
⑤ iron-session이 JWT + user 정보를 암호화해서 httpOnly 쿠키에 저장
    ↓
⑥ 브라우저에겐 { user: { nickname, role } } 만 반환 (JWT는 절대 클라이언트로 나가지 않음!)
```

> **브라우저 입장**: JWT가 뭔지 모릅니다. 그냥 `app_session`이라는 암호화된 쿠키만 받습니다.

---

### 4단계 — Spring Boot가 JWT를 발급하는 과정

**파일:** `backend/.../AuthController.java` → `LoginService.java` → `JwtTokenProvider.java`

```
POST /auth/login { username, password }
    ↓
AuthController.login()
    ↓
LoginService.login()
    ↓
AuthenticationManager.authenticate()  ← 비밀번호 검증
    ↓
JdbcUserDetailsManager → DB SELECT: SELECT nickname, password, role FROM users WHERE nickname = ?
    ↓
BCrypt 비밀번호 검증 통과
    ↓
JwtTokenProvider.generateToken()  ← JWT 발급 (HS256, 24시간)
    ↓
{ token: "eyJhbGciOiJIUzI1NiJ9...", username: "admin", role: "ROLE_ADMIN" } 반환
```

---

## 🔒 로그인 이후 — API 요청마다 JWT가 자동 주입되는 흐름

### 예시: 어드민이 메뉴 목록을 불러올 때

**파일:** `frontend/app/api/[...path]/route.ts` (Catch-all 프록시)

```
브라우저: fetch('/api/admin/menus')
    ↓
쿠키 자동 전송: app_session=암호화덩어리 (브라우저가 자동으로 붙임)
    ↓
[Next.js 서버] app/api/[...path]/route.ts 실행
    ↓
① getSession() → app_session 쿠키 복호화 → JWT 꺼냄
② path = "/api/admin/menus" → backendPath = "/admin/menus"
③ headers['Authorization'] = `Bearer eyJhbGci...`  ← JWT 주입!
    ↓
fetch("http://localhost:8031/admin/menus", { Authorization: Bearer JWT })
    ↓
[Spring Boot] JwtAuthenticationFilter 실행
    ↓
① Authorization 헤더에서 JWT 추출
② JwtTokenProvider.validateToken(jwt) → 유효성 검증
③ JwtTokenProvider.getUsernameFromToken(jwt) → "admin"
④ JdbcUserDetailsManager.loadUserByUsername("admin") → DB 조회
⑤ SecurityContext에 인증 정보 등록
    ↓
SecurityConfig: .requestMatchers("/admin/**").hasRole("ADMIN")
→ ROLE_ADMIN이면 통과, 아니면 403
    ↓
AdminMenuController.getMenuList() 실행
    ↓
{ menus: [...] } 반환
    ↓
[Next.js 서버] 응답 그대로 브라우저에 전달
    ↓
브라우저: 메뉴 목록 화면에 표시
```

---

## 🚪 페이지 접근 보호 — Middleware

**파일:** `frontend/middleware.ts`

```
브라우저가 /admin/menus 페이지 접근 시도
    ↓
middleware.ts 실행 (모든 요청에 대해 먼저 실행됨)
    ↓
PROTECTED_PATHS = ['/admin'] → 보호 경로 해당
    ↓
쿠키에 'app_session'이 있는지 확인
    ↓
없으면 → /login?redirect=/admin/menus 로 리다이렉트
있으면 → 통과 (쿠키 내용 복호화는 안 함, 존재 여부만 확인)
```

> **주의**: Middleware는 쿠키가 "존재"하는지만 확인합니다. 실제 JWT 유효성은 Spring Boot가 API 요청마다 검증합니다.

---

## 📊 전체 흐름 한눈에 보기

```
[브라우저]                [Next.js 서버]                 [Spring Boot]     [DB]
    │                          │                               │              │
    │─── POST /api/auth/login ─▶                               │              │
    │    {username, password}  │── POST /auth/login ──────────▶│              │
    │                          │   {username, password}        │── SELECT ───▶│
    │                          │                               │◀─ user,pwd ──│
    │                          │◀── {token:"eyJ..."} ──────────│              │
    │                          │── GET /auth/me ───────────────▶│              │
    │                          │   Authorization: Bearer JWT    │              │
    │                          │◀── {nickname, role} ───────────│              │
    │                          │                               │              │
    │                          │  JWT → iron-session 암호화    │              │
    │                          │  → app_session 쿠키 저장      │              │
    │◀── Set-Cookie:app_session│                               │              │
    │    {user:{nickname,role}}│                               │              │
    │                          │                               │              │
    │─── GET /api/admin/menus ─▶                               │              │
    │    Cookie: app_session   │  쿠키 복호화 → JWT 추출       │              │
    │                          │── GET /admin/menus ───────────▶│              │
    │                          │   Authorization: Bearer JWT    │── 인증/인가 ─▶│
    │◀── {menus:[...]} ────────│◀── {menus:[...]} ─────────────│              │
```

---

## 핵심 파일 역할 정리

| 역할 | 파일 경로 |
|------|----------|
| **로그인 폼 (UI)** | `frontend/components/auth/LoginForm.tsx` |
| **API 유틸리티** | `frontend/app/lib/api.ts` |
| **세션 설정 (iron-session)** | `frontend/app/lib/session.ts` |
| **로그인 처리 Route** | `frontend/app/api/auth/login/route.ts` |
| **로그아웃 처리 Route** | `frontend/app/api/auth/logout/route.ts` |
| **세션 조회 Route** | `frontend/app/api/auth/session/route.ts` |
| **JWT 자동 주입 (Catch-all 프록시)** | `frontend/app/api/[...path]/route.ts` |
| **페이지 접근 보호** | `frontend/middleware.ts` |
| **JWT 발급** | `backend/.../security/JwtTokenProvider.java` |
| **JWT 요청 검증** | `backend/.../security/JwtAuthenticationFilter.java` |
| **권한 제어** | `backend/.../config/SecurityConfig.java` |
| **유저 DB 조회** | `backend/.../security/SecurityBeanConfig.java` |

---

## 보안 포인트 요약

| 항목 | 내용 |
|------|------|
| **JWT 저장 위치** | Next.js 서버의 iron-session (httpOnly 쿠키) |
| **브라우저의 JWT 접근** | ❌ 불가 (httpOnly 쿠키이므로 JavaScript 접근 차단) |
| **XSS 공격에 대한 안전성** | ✅ httpOnly 쿠키는 스크립트로 탈취 불가 |
| **CSRF 방어** | ✅ sameSite: 'lax' 설정 |
| **JWT 만료 처리** | Spring Boot 401 응답 시 Catch-all 프록시가 세션 자동 삭제 |
| **Secret Key 관리** | 환경변수 `JWT_SECRET`으로 관리 (application.properties에서 주입) |
