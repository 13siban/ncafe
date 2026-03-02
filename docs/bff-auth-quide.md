# BFF 인증 구현 가이드

> Next.js(App Router) + Spring Boot 프로젝트에서 BFF 패턴으로 안전한 인증을 구현하는 가이드입니다.

---

## 목차

1. [왜 BFF 패턴인가?](#1-왜-bff-패턴인가)
2. [동작 흐름](#2-동작-흐름)
3. [전체 아키텍처](#3-전체-아키텍처)
4. [환경변수 설정](#4-환경변수-설정)
4. [Step 1: iron-session 설치 및 세션 설정](#step-1-iron-session-설치-및-세션-설정)
5. [Step 2: 인증 API Routes 생성](#step-2-인증-api-routes-생성)
6. [Step 3: Catch-All API 프록시](#step-3-catch-all-api-프록시)
7. [Step 4: Next.js Middleware (라우트 보호)](#step-4-nextjs-middleware-라우트-보호)
8. [Step 5: 클라이언트 fetchAPI 유틸리티](#step-5-클라이언트-fetchapi-유틸리티)
9. [Step 6: next.config.ts 설정](#step-6-nextconfigts-설정)
10. [Step 7: 로그인 페이지 구현](#step-7-로그인-페이지-구현)
11. [Step 8: Google OAuth 연동 (선택)](#step-8-google-oauth-연동-선택)
12. [체크리스트](#체크리스트)

---

## 1. 왜 BFF 패턴인가?

### 일반적인 (취약한) 방식

```
브라우저 localStorage에 JWT 저장 → XSS 공격에 노출
```

- `localStorage`는 JavaScript로 자유롭게 접근 가능
- XSS 취약점이 하나라도 있으면 JWT가 탈취됨
- Next.js 서버(SSR)에서 인증 상태를 알 수 없음

### BFF 패턴

```
브라우저 → httpOnly 쿠키(암호화) → Next.js API Route → JWT 주입 → Spring Boot
```

- JWT는 **Next.js 서버만** 알고 있음 (브라우저 JavaScript 접근 불가)
- `httpOnly` 쿠키는 XSS로 탈취 불가능
- 서버 사이드에서 인증 상태 확인 가능

### 한 줄 요약

> **브라우저는 JWT를 절대 보지 못한다. Next.js 서버가 대신 관리한다.**

---

## 2. 동작 흐름

### 로그인 시점

```
브라우저                    Next.js 서버                  Spring Boot
  │                           │                              │
  │ POST /api/auth/login      │                              │
  │ {email, password}         │                              │
  │──────────────────────────▶│                              │
  │                           │  POST /api/auth/login        │
  │                           │  {email, password}           │
  │                           │─────────────────────────────▶│
  │                           │                              │
  │                           │  { token: "eyJhbG..." }      │
  │                           │◀─────────────────────────────│
  │                           │                              │
  │                           │  JWT를 iron-session으로      │
  │                           │  암호화하여 쿠키에 저장       │
  │                           │                              │
  │  Set-Cookie: app_session  │                              │
  │  = 암호화된_덩어리        │                              │
  │  (httpOnly, JWT 안 보임)  │                              │
  │  + { user: {nickname} }   │                              │
  │◀──────────────────────────│                              │
```

- 브라우저는 `{user: {nickname}}` 만 받음 (JWT는 받지 못함)
- JWT는 암호화된 쿠키 안에 숨겨져 있음 (JavaScript 접근 불가)

### 이후 API 호출 (예: 게시글 목록)

```
브라우저                    Next.js 서버                  Spring Boot
  │                           │                              │
  │ GET /api/posts            │                              │
  │ Cookie: app_session=...   │                              │
  │ (브라우저가 자동 전송)     │                              │
  │──────────────────────────▶│                              │
  │                           │  쿠키 복호화 → JWT 추출       │
  │                           │                              │
  │                           │  GET /api/posts              │
  │                           │  Authorization: Bearer JWT   │
  │                           │─────────────────────────────▶│
  │                           │                              │
  │                           │  { posts: [...] }            │
  │                           │◀─────────────────────────────│
  │                           │                              │
  │  { posts: [...] }         │                              │
  │◀──────────────────────────│                              │
```

- 브라우저는 JWT를 전혀 모름. 쿠키만 자동 전송
- Next.js 서버가 쿠키에서 JWT를 꺼내 `Authorization` 헤더에 넣어줌

---

## 3. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  브라우저 (클라이언트)                                     │
│                                                         │
│  fetch('/api/posts')  ──쿠키 자동 전송──▶               │
│  fetch('/api/auth/login', {body})  ──────▶               │
└───────────────────────────────┬─────────────────────────┘
                                │ httpOnly 쿠키 (암호화)
                                ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js 서버 (BFF)                                      │
│                                                         │
│  /api/auth/login     → Spring Boot 로그인 → 세션 저장    │
│  /api/auth/logout    → 세션 삭제                         │
│  /api/auth/session   → 세션에서 user 정보 반환            │
│  /api/[...path]      → 세션에서 JWT 꺼내서 헤더 주입      │
│                                                         │
│  middleware.ts        → 보호 경로 접근 시 쿠키 체크        │
└───────────────────────────────┬─────────────────────────┘
                                │ Authorization: Bearer JWT
                                ▼
┌─────────────────────────────────────────────────────────┐
│  Spring Boot (API 서버)                                   │
│                                                         │
│  /api/auth/login      → JWT 발급                         │
│  /api/auth/me         → 현재 사용자 정보                  │
│  /api/posts, etc.     → 비즈니스 API                     │
└─────────────────────────────────────────────────────────┘
```

### 핵심 파일 구조

```
frontend-web/
├── .env                              # 환경변수
├── middleware.ts                      # 라우트 보호
├── next.config.ts                    # rewrite 설정
└── app/
    ├── lib/
    │   ├── session.ts                # iron-session 설정
    │   └── api.ts                    # 클라이언트 fetchAPI 유틸리티
    ├── api/
    │   ├── auth/
    │   │   ├── login/route.ts        # 로그인 (JWT → 세션 쿠키 저장)
    │   │   ├── logout/route.ts       # 로그아웃 (세션 쿠키 삭제)
    │   │   ├── session/route.ts      # 세션 조회
    │   │   ├── signup/route.ts       # 회원가입 프록시
    │   │   └── oauth/callback/route.ts  # OAuth 콜백 (선택)
    │   └── [...path]/
    │       └── route.ts              # Catch-all API 프록시
    └── login/
        └── page.tsx                  # 로그인 페이지
```

---

## 3. 환경변수 설정

`.env` 파일에 다음 환경변수를 추가합니다:

```env
# === BFF 세션 (iron-session 암호화 키, 32자 이상) ===
SESSION_SECRET=여기에-32자-이상의-랜덤-문자열을-입력하세요

# === 내부 서비스 URL (Next.js 서버 → Spring Boot) ===
API_BASE_URL=http://localhost:8080

# === 프론트엔드 공개 URL (리다이렉트용) ===
FRONTEND_BASE_URL=http://localhost:3000
```

> **주의**: `SESSION_SECRET`은 반드시 32자 이상이어야 합니다. 운영 환경에서는 랜덤 생성한 값을 사용하세요.

---

## Step 1: iron-session 설치 및 세션 설정

### 설치

```bash
npm install iron-session
```

### `app/lib/session.ts`

```typescript
import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

// ──────────────────────────────────────
// 세션에 저장할 사용자 정보 타입
// 여러분의 Spring Boot /api/auth/me 응답에 맞게 수정하세요
// ──────────────────────────────────────
export interface SessionUser {
  id: number;
  email: string;
  nickname: string;
  role: string;
  // 필요에 따라 필드 추가/제거
}

export interface SessionData {
  token: string;      // Spring Boot에서 발급받은 JWT
  user: SessionUser;  // 사용자 정보
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'default-secret-change-in-production-32-chars-min',
  cookieName: 'app_session', // 원하는 쿠키 이름으로 변경
  cookieOptions: {
    httpOnly: true,                                   // JavaScript 접근 차단
    secure: process.env.NODE_ENV === 'production',    // 운영에서만 HTTPS 필수
    sameSite: 'lax' as const,                         // CSRF 기본 방어
    path: '/',
    maxAge: 60 * 60 * 24,                             // 24시간 (JWT 만료시간과 맞추기)
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
```

**핵심 포인트:**
- `httpOnly: true` → 브라우저 JavaScript에서 쿠키 접근 불가
- `secure: true` → HTTPS에서만 쿠키 전송 (개발환경에서는 false)
- `password` → 쿠키 내용을 암호화하는 키 (32자 이상 필수)

---

## Step 2: 인증 API Routes 생성

### `app/api/auth/login/route.ts` — 로그인

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1. Spring Boot 로그인 API 호출 (서버 → 서버)
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!loginRes.ok) {
    const error = await loginRes.json().catch(() => ({ message: '로그인에 실패했습니다.' }));
    return NextResponse.json(error, { status: loginRes.status });
  }

  const tokenData = await loginRes.json();
  const token = tokenData.accessToken || tokenData.token;

  if (!token) {
    return NextResponse.json({ message: '토큰을 받지 못했습니다.' }, { status: 500 });
  }

  // 2. 사용자 정보 조회
  const meRes = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let user = null;
  if (meRes.ok) {
    user = await meRes.json();
  }

  // 3. 세션에 저장 (httpOnly 쿠키로 암호화되어 저장됨)
  const session = await getSession();
  session.token = token;
  if (user) {
    session.user = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      // SessionUser 인터페이스에 맞게 매핑
    };
  }
  await session.save();

  // 4. 클라이언트에 user 정보만 반환 (JWT는 절대 반환하지 않음!)
  return NextResponse.json({ user: session.user });
}
```

**흐름 요약:**
1. 클라이언트가 `POST /api/auth/login` 호출 (email, password)
2. Next.js 서버가 Spring Boot에 서버 간 통신으로 로그인
3. JWT를 받아서 암호화된 httpOnly 쿠키에 저장
4. 클라이언트에게는 사용자 정보만 반환 (**JWT는 반환하지 않음**)

---

### `app/api/auth/logout/route.ts` — 로그아웃

```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

export async function POST() {
  const session = await getSession();
  session.destroy();   // 세션 쿠키 삭제
  return NextResponse.json({ ok: true });
}
```

---

### `app/api/auth/session/route.ts` — 세션 조회

```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session.token) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: session.user });
}
```

클라이언트에서 현재 로그인 상태를 확인할 때 사용합니다.

---

### `app/api/auth/signup/route.ts` — 회원가입

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
```

---

## Step 3: Catch-All API 프록시

이것이 BFF 패턴의 핵심입니다. 클라이언트의 모든 `/api/*` 요청을 받아서, 세션 쿠키에서 JWT를 꺼내 `Authorization` 헤더에 넣고 Spring Boot로 전달합니다.

### `app/api/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

async function proxyRequest(req: NextRequest) {
  const session = await getSession();
  const path = req.nextUrl.pathname;   // 예: /api/posts
  const search = req.nextUrl.search;   // 예: ?page=0&size=10
  const targetUrl = `${API_BASE}${path}${search}`;

  // 요청 헤더 구성
  const headers: Record<string, string> = {};

  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const accept = req.headers.get('accept');
  if (accept) {
    headers['Accept'] = accept;
  }

  // ★ 핵심: 세션에 JWT가 있으면 Authorization 헤더 주입
  if (session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  // 요청 본문 전달
  let body: BodyInit | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (contentType?.includes('multipart/form-data')) {
      body = await req.blob();  // 파일 업로드
    } else {
      body = await req.text();  // JSON 등
    }
  }

  const proxyRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  // 401 응답 시 세션 삭제 (JWT 만료)
  if (proxyRes.status === 401 && session.token) {
    session.destroy();
  }

  // 응답 전달
  const responseHeaders = new Headers();
  const resContentType = proxyRes.headers.get('content-type');
  if (resContentType) {
    responseHeaders.set('Content-Type', resContentType);
  }

  return new NextResponse(proxyRes.body, {
    status: proxyRes.status,
    statusText: proxyRes.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
```

**이 파일 하나로:**
- `GET /api/posts` → Spring Boot `/api/posts` (JWT 자동 주입)
- `POST /api/posts` → Spring Boot `/api/posts` (JWT 자동 주입)
- `DELETE /api/posts/1` → Spring Boot `/api/posts/1` (JWT 자동 주입)

클라이언트 코드에서는 JWT를 전혀 신경 쓸 필요 없이 그냥 `fetch('/api/...')`만 하면 됩니다.

---

## Step 4: Next.js Middleware (라우트 보호)

로그인 필요한 페이지에 비로그인 사용자가 접근하면 자동으로 `/login`으로 보냅니다.

### `middleware.ts` (프로젝트 루트)

```typescript
import { NextRequest, NextResponse } from 'next/server';

// 로그인 필요한 경로
const PROTECTED_PATHS = ['/my', '/admin'];

// 인증 체크 건너뛸 경로
const PUBLIC_PATHS = ['/login', '/signup', '/oauth', '/api', '/_next'];

// session.ts의 cookieName과 반드시 동일하게!
const SESSION_COOKIE_NAME = 'app_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로는 건너뜀
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 정적 파일은 건너뜀
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // 보호 경로인지 확인
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected) {
    return NextResponse.next();
  }

  // 세션 쿠키 존재 여부 확인
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

> **주의**: `SESSION_COOKIE_NAME`은 `session.ts`의 `cookieName`과 **반드시 동일**해야 합니다.

---

## Step 5: 클라이언트 fetchAPI 유틸리티

클라이언트 컴포넌트에서 API를 호출하는 공통 유틸리티입니다.

### `app/lib/api.ts`

```typescript
export async function fetchAPI(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
      // credentials: 'same-origin' 이 기본값이므로 쿠키 자동 전송
    });

    if (!res.ok) {
      // 401이면 로그인 페이지로 리다이렉트
      if (res.status === 401 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        return;
      }
      const error: any = new Error(`API Error: ${res.status}`);
      error.status = res.status;
      try {
        const body = await res.json();
        error.message = body.message || error.message;
      } catch { /* no json body */ }
      throw error;
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return null;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError: any = new Error('Network Error: 서버에 연결할 수 없습니다.');
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  }
}

// 인증 API 모음
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    fetchAPI('/auth/logout', { method: 'POST' }),

  signup: (email: string, password: string, nickname: string) =>
    fetchAPI('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    }),

  getSession: () => fetchAPI('/auth/session'),
};
```

**핵심 포인트:**
- `localStorage` 관련 코드가 **전혀 없음**
- `Authorization` 헤더를 수동으로 넣지 않음 (프록시가 처리)
- 쿠키는 브라우저가 자동 전송 (`same-origin` 기본값)
- 401 에러 시 로그인 페이지로 리다이렉트

---

## Step 6: next.config.ts 설정

### OAuth를 사용하지 않는 경우 (이메일/비밀번호만)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // rewrite 없음 — 모든 /api 요청은 Catch-all API Route가 처리
};

export default nextConfig;
```

### OAuth를 사용하는 경우

Spring Boot의 OAuth2 엔드포인트는 API Route가 아닌 직접 연결이 필요합니다:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
    return {
      // beforeFiles: API Route보다 먼저 매칭
      // OAuth 관련 요청만 Spring Boot로 직접 전달
      beforeFiles: [
        {
          source: "/api/oauth2/:path*",
          destination: `${apiBase}/api/oauth2/:path*`,
        },
        {
          source: "/api/login/oauth2/:path*",
          destination: `${apiBase}/api/login/oauth2/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
```

> **왜 beforeFiles?** OAuth2 엔드포인트(`/api/oauth2/authorization/google`)는 Spring Security가 세션 기반으로 처리해야 하므로, Next.js API Route(Catch-all)가 가로채면 안 됩니다.

---

## Step 7: 로그인 페이지 구현

### `app/login/page.tsx` (핵심 부분만)

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/app/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await authAPI.login(email, password);

      // 다른 컴포넌트에게 로그인 상태 변경 알림
      window.dispatchEvent(new Event('login'));

      // 리다이렉트
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
      />
      {error && <p>{error}</p>}
      <button type="submit">로그인</button>
    </form>
  );
}
```

**`localStorage` 관련 코드가 전혀 없다는 점에 주목하세요.**

---

### Header 컴포넌트에서 로그인 상태 확인

```tsx
'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/app/lib/api';

export default function Header() {
  const [user, setUser] = useState<any>(null);

  const checkLoginStatus = async () => {
    try {
      const data = await authAPI.getSession();
      setUser(data?.user || null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    checkLoginStatus();

    // 다른 컴포넌트에서 login/logout 이벤트 발생 시 갱신
    const onLogin = () => checkLoginStatus();
    const onLogout = () => setUser(null);

    window.addEventListener('login', onLogin);
    window.addEventListener('logout', onLogout);

    return () => {
      window.removeEventListener('login', onLogin);
      window.removeEventListener('logout', onLogout);
    };
  }, []);

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    window.dispatchEvent(new Event('logout'));
  };

  return (
    <header>
      {user ? (
        <>
          <span>{user.nickname}님</span>
          <button onClick={handleLogout}>로그아웃</button>
        </>
      ) : (
        <a href="/login">로그인</a>
      )}
    </header>
  );
}
```

---

## Step 8: Google OAuth 연동 (선택)

OAuth는 이메일/비밀번호 로그인과 흐름이 다릅니다.

### 전체 흐름

```
1. 로그인 페이지에서 "Google 로그인" 클릭
2. oauth_redirect 쿠키에 돌아올 경로 저장
3. /api/oauth2/authorization/google 로 이동 (→ rewrite → Spring Boot)
4. Google 로그인 완료 후 Spring Boot가 JWT 발급
5. Spring Boot가 /api/auth/oauth/callback?token=JWT&email=... 으로 리다이렉트
6. Next.js API Route가 JWT를 세션 쿠키에 저장
7. 2번에서 저장한 경로로 리다이렉트
```

### Google 로그인 버튼 (로그인 페이지에 추가)

```tsx
const handleGoogleLogin = () => {
  // 로그인 후 돌아올 경로를 쿠키에 저장
  const redirect = searchParams.get('redirect') || '/';
  document.cookie = `oauth_redirect=${encodeURIComponent(redirect)}; path=/; max-age=600`;

  // Spring Boot OAuth 엔드포인트로 이동
  window.location.href = '/api/oauth2/authorization/google';
};
```

### `app/api/auth/oauth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const error = searchParams.get('error');

  const baseUrl = FRONTEND_BASE_URL;

  // OAuth redirect 경로 (쿠키에서 읽기)
  const oauthRedirect = req.cookies.get('oauth_redirect')?.value || '/';

  if (error || !token) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('error', error || 'oauth_failed');
    return NextResponse.redirect(loginUrl);
  }

  // 사용자 정보 조회
  const meRes = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let user = null;
  if (meRes.ok) {
    user = await meRes.json();
  }

  // 세션에 저장
  const session = await getSession();
  session.token = token;
  if (user) {
    session.user = {
      id: user.id,
      email: user.email || email || '',
      nickname: user.nickname,
      role: user.role,
      // SessionUser 인터페이스에 맞게 매핑
    };
  }
  await session.save();

  // 리다이렉트 (oauth_redirect 쿠키 삭제 포함)
  const redirectUrl = new URL(oauthRedirect, baseUrl);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete('oauth_redirect');
  return response;
}
```

### Spring Boot 환경변수

Spring Boot의 OAuth2 성공 핸들러가 리다이렉트하는 URL을 `.env`에서 설정합니다:

```env
OAUTH2_REDIRECT_URI=http://localhost:3000/api/auth/oauth/callback
```

> **중요**: 이 URL은 Next.js API Route를 가리켜야 합니다 (Spring Boot가 아닌).

---

## 체크리스트

구현 완료 후 다음을 확인하세요:

### 필수 확인

- [ ] `npm install iron-session` 설치 완료
- [ ] `.env`에 `SESSION_SECRET` (32자 이상) 설정
- [ ] `.env`에 `API_BASE_URL` 설정
- [ ] `app/lib/session.ts` 생성
- [ ] `app/api/auth/login/route.ts` 생성
- [ ] `app/api/auth/logout/route.ts` 생성
- [ ] `app/api/auth/session/route.ts` 생성
- [ ] `app/api/[...path]/route.ts` 생성
- [ ] `middleware.ts` 생성
- [ ] `middleware.ts`의 `SESSION_COOKIE_NAME`과 `session.ts`의 `cookieName` 일치 확인

### 동작 확인

- [ ] 로그인 후 브라우저 DevTools → Application → Cookies 에서 httpOnly 쿠키 확인
- [ ] `localStorage`에 token이 **없는 것** 확인
- [ ] 로그인 후 보호 페이지(`/my`, `/admin`) 정상 접근
- [ ] 로그아웃 후 보호 페이지 접근 시 `/login`으로 리다이렉트
- [ ] 새 탭에서 인증 상태 유지 확인

### 기존 코드 정리

- [ ] `localStorage.getItem('token')` 코드 전부 삭제
- [ ] `localStorage.setItem('token', ...)` 코드 전부 삭제
- [ ] `Authorization` 헤더를 수동으로 넣는 코드 전부 삭제
- [ ] `fetch('/api/...', { headers: { Authorization: ... } })` 패턴 전부 삭제

---

## FAQ

### Q: 기존 fetch 코드를 어떻게 바꿔야 하나요?

**Before (취약한 방식):**
```typescript
const token = localStorage.getItem('token');
const res = await fetch('/api/posts', {
  headers: { Authorization: `Bearer ${token}` },
});
```

**After (BFF 방식):**
```typescript
const res = await fetch('/api/posts');
// 끝! JWT는 프록시가 자동 주입
```

### Q: SSR(서버 컴포넌트)에서 인증된 API를 호출하려면?

서버 컴포넌트에서는 `getSession()`을 직접 사용하고, Spring Boot에 직접 요청합니다:

```typescript
import { getSession } from '@/app/lib/session';

export default async function MyPage() {
  const session = await getSession();

  const res = await fetch(`${process.env.API_BASE_URL}/api/my/data`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  const data = await res.json();
  return <div>{data.name}</div>;
}
```

### Q: 여러 API 서버가 있으면 어떻게 하나요?

Catch-all 프록시에서 경로에 따라 분기하면 됩니다:

```typescript
async function proxyRequest(req: NextRequest) {
  const path = req.nextUrl.pathname;

  let targetBase = API_BASE;
  if (path.startsWith('/api/ai/')) {
    targetBase = process.env.AI_BASE_URL || 'http://localhost:8000';
  }

  // ... 나머지 프록시 로직
}
```

### Q: `window.dispatchEvent(new Event('login'))`은 왜 필요한가요?

SPA에서 Header와 로그인 페이지는 서로 다른 컴포넌트입니다. 로그인 성공 후 Header가 즉시 상태를 갱신하려면 이벤트로 알려줘야 합니다. 이건 BFF와 무관한 순수 React 패턴입니다.
