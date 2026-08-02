# ncafe 데모 로그인 모달 — 분석 및 계획

> 목표: 로그인 페이지에 모달을 띄워 버튼 한 번으로 `subadmin`(부관리자) 로그인.
> 참고: 같은 작업을 아늑(team3-Anook)에 먼저 적용했다. 그쪽 설계 문서는 `team3-Anook/docs/DEMO_LOGIN_설계안.md`.

---

## 0. 결론 먼저

**ncafe는 아늑보다 훨씬 쉽다. 백엔드 변경이 하나도 필요 없다.**

아늑에서 발목을 잡았던 3가지가 ncafe에는 **전부 없거나 이미 해결되어 있다.**

| 아늑에서의 문제 | ncafe 상태 |
|---|---|
| 세션 있으면 `/login`이 렌더링 안 됨 (미들웨어 리다이렉트) | ✅ **없음** — `/login`은 `PUBLIC_PATHS`라 항상 렌더 |
| 동시 접속 시 JTI 충돌로 서로 튕겨냄 | ✅ **없음** — 단일 세션 강제 로직 자체가 없음 |
| 데모용 제한 계정을 새로 만들어야 함 | ✅ **이미 있음** — `subadmin` 시드 + 권한 제한까지 구현됨 |

즉 **프론트엔드 3~4개 파일만 추가/수정**하면 끝난다.

---

## 1. 현황 분석

### 1.1 기술 스택

- **프론트**: Next.js 16.1.6 (App Router), iron-session, zustand, react-hot-toast, framer-motion
- **백엔드**: Spring Boot, Hexagonal, Spring Security + JWT
- **BFF**: 프론트의 `app/api/[...path]/route.ts`가 통합 라우터 역할
- 인증 방식은 아늑과 동일한 **iron-session 암호화 쿠키 + 내부 JWT** 구조

### 1.2 세션 구조

[frontend/app/lib/session.ts:22-32](frontend/app/lib/session.ts#L22-L32)

```ts
cookieName: 'app_session'
httpOnly: true
secure: process.env.SESSION_SECURE === 'true'
sameSite: 'lax'
maxAge: 60 * 60 * 24        // 24시간 — 아늑과 달리 명시적 만료가 있다
```

세션에 담기는 값: `token`(백엔드 JWT), `user{id,email,nickname,role,phoneNumber,grade}`

### 1.3 로그인 흐름

```
LoginForm (client)
  └ authAPI.login(username, password)          app/lib/api/authAPI.ts:6
      └ POST /api/auth/login                    (BFF)
          └ handleLogin()                       app/api/[...path]/handlers/authHandlers.ts:31
              ├ POST {API_BASE}/auth/login      → JWT 획득
              ├ GET  {API_BASE}/auth/me         → 사용자 정보 조회
              └ session.save()
      └ useAuthStore.setUser(res.user)
      └ window.dispatchEvent(new Event('login'))
      └ router.push(redirect ?? '/') + router.refresh()
```

로그인 후 이동 위치는 [LoginForm.tsx:40-46](frontend/components/auth/LoginForm/LoginForm.tsx#L40-L46):
`searchParams.get('redirect')`가 있으면 그쪽, 없으면 **`/`(홈)**.

> ⚠️ 데모 버튼은 홈이 아니라 **`/admin`으로 보내야** 부관리자 화면이 바로 보인다.

### 1.4 미들웨어 — 아늑과 결정적으로 다른 부분

[frontend/middleware.ts:9](frontend/middleware.ts#L9)

```ts
const PUBLIC_PATHS = ['/login', '/signup', '/api', '/_next', '/menus', '/about'];

if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();     // ← /login은 무조건 통과
}
```

**로그인한 사용자가 `/login`에 가도 리다이렉트되지 않는다.**
아늑에서 미들웨어를 고쳐야 했던 이유가 여기선 애초에 발생하지 않는다.
→ **`middleware.ts`는 손대지 않는다.**

보호 경로는 `/admin`뿐이고, 세션의 `role`이 `ROLE_ADMIN` 또는 `ROLE_SUB_ADMIN`이어야 통과한다
([middleware.ts:46](frontend/middleware.ts#L46)).

### 1.5 `subadmin` 계정 — 이미 존재한다

[backend/.../config/DataInitializer.java:249-256](backend/src/main/java/com/new_cafe/app/backend/config/DataInitializer.java#L249-L256)

```java
createUser("hong_id",  "hong",     "1234", "ROLE_ADMIN",     ...);
createUser("admin",    "admin",    "1234", "ROLE_ADMIN",     ...);
createUser("subadmin", "subadmin", "1234", "ROLE_SUB_ADMIN", ...);   // ★
createUser("user",     "user",     "1234", "ROLE_USER",      ...);
```

- 아이디 `subadmin` / 비밀번호 `1234` / 역할 `ROLE_SUB_ADMIN`
- 프론트 표시명은 **"부관리자"** ([AdminSidebar.tsx:192](frontend/app/admin/_components/AdminSidebar/AdminSidebar.tsx#L192))

> ⚠️ **시드 조건 확인 필요**: `DataInitializer`는 `userRepository.count() == 0`일 때만 사용자를 만든다
> ([DataInitializer.java:56](backend/src/main/java/com/new_cafe/app/backend/config/DataInitializer.java#L56)).
> 운영 DB는 최초 기동 때 시드됐을 테니 `subadmin`이 있을 것으로 보이지만, **배포 전에 실제 로그인으로 확인**해야 한다.
> 없으면 회원가입 후 관리자 화면에서 역할을 부여하거나 시드 로직을 손봐야 한다. (→ §5 사전 확인)

### 1.6 SUB_ADMIN은 실제로 권한이 제한되어 있다 ✅

아늑에서는 "부관리자" 개념을 새로 만들어야 했지만, **ncafe는 이미 구현되어 있다.**

[backend/.../config/SecurityConfig.java:54-57](backend/src/main/java/com/new_cafe/app/backend/config/SecurityConfig.java#L54-L57)

```java
// 회원 정보 수정/삭제는 ADMIN 전용
.requestMatchers(HttpMethod.PUT,    "/admin/users/**", "/api/admin/users/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.DELETE, "/admin/users/**", "/api/admin/users/**").hasRole("ADMIN")
// 나머지 관리자 화면은 SUB_ADMIN도 허용
.requestMatchers("/admin/**", "/api/admin/**").hasAnyRole("ADMIN", "SUB_ADMIN")
```

추가로 메서드 레벨 방어도 있다:

| 컨트롤러 | 제한 |
|---|---|
| `AdminUserController` (7개 메서드) | `@PreAuthorize("hasRole('ADMIN')")` — 회원 관리 전면 차단 |
| `AdminGradeSettingsController` | 조회는 SUB_ADMIN 허용, **수정/삭제는 ADMIN 전용** |

**정리: `subadmin`은 관리자 화면을 둘러볼 수는 있지만 회원을 수정·삭제하거나 등급 정책을 바꿀 수 없다.**
데모 계정으로 쓰기에 딱 맞는 권한 수준이고, 아늑에서 미뤄둔 "쓰기 가드"가 여기선 이미 되어 있는 셈이다.

### 1.7 동시 접속 문제 없음 ✅

[backend/.../auth/application/service/LoginService.java](backend/src/main/java/com/new_cafe/app/backend/auth/application/service/LoginService.java)는
비밀번호 검증 → 잠금 확인 → 탈퇴 확인 → JWT 발급이 전부다.
**아늑의 `jti` 회전 같은 단일 세션 강제 로직이 없다** (`JwtAuthenticationFilter`/`JwtTokenProvider` grep 결과 0건).

> 여러 명이 동시에 `subadmin`으로 접속해도 서로 튕겨내지 않는다. **백엔드 수정 불필요.**

### 1.8 재사용할 UI 자산

| 자산 | 위치 | 비고 |
|---|---|---|
| 인라인 모달 패턴 | [LoginForm.tsx:174-205](frontend/components/auth/LoginForm/LoginForm.tsx#L174-L205) | 탈퇴 복구 모달. `styles.modalOverlay` / `styles.modalContent` **그대로 재사용 가능** |
| 공지 팝업 모달 | [NoticePopupModal.tsx](frontend/components/common/NoticePopupModal/NoticePopupModal.tsx) | localStorage "오늘 하루 보지 않기" 패턴 참고용 |
| 토스트 | `react-hot-toast` | 이미 의존성에 있음 |
| 애니메이션 | `framer-motion` | 모달 등장 효과에 쓸 수 있음 |

**로그인 폼 CSS에 모달 스타일이 이미 있으므로 새 CSS를 거의 안 만들어도 된다.**

### 1.9 배포 구조

[.github/workflows/deploy.yml](.github/workflows/deploy.yml)

```
master 브랜치 push
  → (ubuntu-latest) backend·frontend·agent 3개 이미지 matrix 병렬 빌드 → GHCR push
  → (self-hosted)   .env 생성 → GHCR pull → docker compose up
```

- 현재 브랜치: `master` (아늑처럼 별도 배포 브랜치가 아니라 **master가 곧 배포 브랜치**)
- 서비스 주소: `https://mymyy.com` (young-server 34.64.36.137, 호스트 포트 3031)
- **프론트만 바꾸면 되지만 워크플로가 3개 이미지를 모두 빌드**하므로 배포 시간은 동일

---

## 2. 계획

### 2.1 설계 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 모달 위치 | 로그인 페이지 | 아늑과 동일. 별도 랜딩 불필요 |
| 자동 오픈 | **매 방문마다** | 아늑과 동일하게 통일 |
| 닫기 | X 버튼 + 오버레이 클릭 + ESC | 기존 모달 관례 유지 |
| 재오픈 | 로그인 폼 안의 버튼 | 아늑과 동일 |
| 버튼 개수 | **1개 (부관리자)** | 사용자 요청. 필요하면 나중에 일반 사용자 추가 |
| 자격증명 위치 | **서버 환경변수** | 클라이언트 번들에 비밀번호를 넣지 않는다 |
| 로그인 후 이동 | **기존 동작 그대로** (`redirect` 파라미터 없으면 홈 `/`) | 헤더에 "부관리자"가 뜨고 관리자 메뉴가 노출되므로 강제 이동이 불필요. 방문자가 매장 화면부터 자연스럽게 둘러볼 수 있다 |
| 백엔드 | **변경 없음** | §1.5~1.7 근거 |
| 미들웨어 | **변경 없음** | §1.4 근거 |

### 2.2 변경 파일

| # | 파일 | 작업 |
|---|---|---|
| F1 | `frontend/app/api/[...path]/handlers/authHandlers.ts` | `handleDemoLogin()` 추가 — 기존 `handleLogin`과 `saveUserSession` 재사용 |
| F2 | `frontend/app/api/[...path]/route.ts` | `/api/auth/demo` 분기 1줄 추가 |
| F3 | `frontend/components/auth/DemoLoginModal/DemoLoginModal.tsx` | **신규** 모달 |
| F4 | `frontend/components/auth/DemoLoginModal/DemoLoginModal.module.css` | **신규** (기존 모달 스타일 참고) |
| F5 | `frontend/components/auth/LoginForm/LoginForm.tsx` | 모달 마운트 + 재오픈 버튼 |
| I1 | `docker-compose.yml` | frontend에 `DEMO_SUBADMIN_ID`/`DEMO_SUBADMIN_PW` (기본값 포함) |

> 아늑과 달리 **BFF 라우트 파일을 새로 만들지 않는다.** ncafe는 `[...path]/route.ts` 통합 라우터에
> 분기를 추가하는 방식이 기존 구조에 맞다.

### 2.3 구현 스케치

**F1 — `authHandlers.ts`에 추가**

```ts
/** 포트폴리오 데모 로그인 (부관리자 체험) */
export async function handleDemoLogin(req: NextRequest, session: IronSession<any>) {
    // 자격증명은 서버에서만 읽는다. 클라이언트는 아무것도 보내지 않는다.
    const username = process.env.DEMO_SUBADMIN_ID || 'subadmin';
    const password = process.env.DEMO_SUBADMIN_PW || '1234';

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
        return NextResponse.json(
            { message: '데모 계정을 준비하지 못했습니다.' },
            { status: loginRes.status }
        );
    }

    const tokenData = await loginRes.json();
    const token = tokenData.accessToken || tokenData.token;
    if (!token) return NextResponse.json({ message: 'Token not found' }, { status: 500 });

    await saveUserSession(session, token, tokenData);   // 기존 헬퍼 재사용
    return NextResponse.json({ user: session.user });
}
```

**F2 — `route.ts` 분기 추가**

```ts
if (pathname === '/api/auth/demo' && req.method === 'POST') {
    return handleDemoLogin(req, session);
}
```

**F5 — `LoginForm.tsx`**

기존 로그인 성공 처리와 **동일한 후속 동작**을 타야 헤더/스토어가 갱신된다:

```ts
const handleDemoLogin = async () => {
    const res = await fetch('/api/auth/demo', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    useAuthStore.getState().setUser(data.user);      // ← 빠뜨리면 헤더가 로그아웃 상태로 보임
    window.dispatchEvent(new Event('login'));        // ← 기존 흐름과 동일하게

    // 일반 로그인과 완전히 같은 이동 규칙 (강제로 /admin에 보내지 않는다)
    let redirect = searchParams.get('redirect') || '/';
    if (redirect.startsWith('/login')) redirect = '/';
    router.push(redirect);
    router.refresh();
};
```

### 2.4 작업 순서

1. **§5 사전 확인** — `subadmin/1234`가 운영 DB에 실제로 있는지 먼저 검증 (제일 중요)
2. F1 + F2 (BFF) — 브라우저에서 `fetch('/api/auth/demo',{method:'POST'})`로 단독 검증 가능
3. F3 + F4 (모달)
4. F5 (통합)
5. I1 (환경변수)
6. 로컬 빌드 → 커밋 → `master` push → 배포

---

## 3. 아늑과 다른 점 요약

| | 아늑 | ncafe |
|---|---|---|
| 미들웨어 수정 | 필요 (리다이렉트 제거) | **불필요** |
| 백엔드 수정 | 필요 (시드 + JTI 면제) | **불필요** |
| 데모 계정 | 신규 생성 | **기존 `subadmin` 재사용** |
| 권한 제한 | 미구현 (보류함) | **이미 구현됨** |
| 동시 접속 | 문제 있었음 → 면제 처리 | **원래 문제 없음** |
| 세션 배너 | 필요했음 | 불필요 (리다이렉트가 없어 혼란 없음) |
| 버튼 개수 | 2개 (투숙객/관리자) | 1개 (부관리자) |
| 예상 작업량 | 백엔드+프론트 11파일 | **프론트 6파일** |

---

## 4. 남은 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| 운영 DB에 `subadmin`이 없을 수 있음 | 데모 버튼 실패 | **§5에서 먼저 확인** |
| 운영에서 비밀번호가 `1234`가 아닐 수 있음 | 데모 버튼 실패 | 동일 |
| 방문자가 데모로 데이터를 변경 | 다음 방문자 화면 오염 | SUB_ADMIN이 회원/등급은 못 건드림. 메뉴·주문 등은 가능 — 필요해지면 추가 제한 검토 |
| `subadmin` 계정이 잠기면(`isEnabled=false`) | 로그인 차단 | 관리자 화면에서 해제 |

---

## 5. 사전 확인 — ✅ 완료

운영 환경에서 직접 확인함:

- [x] `subadmin` / `1234` 로그인 성공
- [x] `/admin` 진입 가능
- [x] 사이드바에 **"부관리자"** 로 표시됨

→ §4의 최대 리스크(운영 DB에 계정 없음/비밀번호 불일치)가 해소됐다.
**백엔드 작업 없이 프론트만 구현하면 된다.**
