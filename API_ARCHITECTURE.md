# ncafe API 요청 아키텍처 레퍼런스

## 요청 흐름

```
[브라우저] → [Next.js BFF] → [Spring Boot]
```

1. 컴포넌트: `fetchAPI('/menus')` 호출
2. client.ts: `/api` prefix 자동 추가 → `fetch('/api/menus')`
3. Catch-all Route (`/app/api/[...path]/route.ts`): 요청 수신
4. proxyHandler.ts: `/api` 제거 → `http://localhost:8080/menus` 프록시
5. Spring Boot: `@RequestMapping("/menus")` 처리

## 핵심 규칙

- **API 버전 prefix (`v1/` 등) 사용하지 않음**
- JWT는 BFF에서 세션 기반 자동 주입 (클라이언트 토큰 관리 불필요)
- Nginx는 모든 요청을 Next.js로 전달만 함 (API 경로 분기 불필요)

## fetchAPI 사용 예시

```typescript
fetchAPI('/menus')         // → /api/menus → localhost:8080/menus
fetchAPI('/orders')        // → /api/orders → localhost:8080/orders
fetchAPI('/admin/menus')   // → /api/admin/menus → localhost:8080/admin/menus
```

## 프록시 경로 변환 (proxyHandler.ts)

| 요청 경로 | 변환 | 대상 서버 |
|-----------|------|-----------|
| `/api/*` | `/api` 제거 | Spring Boot (8080) |
| `/api/vector/*` | 그대로 | FastAPI (8000) |
| `/images/*` | `/upload/*` 변환 | Spring Boot (8080) |

## 백엔드 경로 패턴

- 공개: `/menus`, `/categories`, `/store`, `/gallery`, `/orders`, `/auth`
- 관리자: `/admin/menus`, `/admin/orders`, `/admin/categories`, `/admin/sales` 등
