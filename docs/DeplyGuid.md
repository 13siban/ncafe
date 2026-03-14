# AI에게 전달하는 배포 환경 구성 지시서

> 이 문서를 AI에게 통째로 전달하고, 마지막에 자신의 정보(포트 번호, 사용자 ID 등)를 알려주세요.
> AI가 프로젝트의 CI/CD 배포 환경을 자동으로 구성해 줍니다.

---

## 여기부터 AI에게 전달하세요

---

너는 지금부터 내 프로젝트에 GitHub Actions 기반 CI/CD 배포 환경을 구성해야 해.
아래 설명을 읽고, 내가 마지막에 알려줄 **나만의 설정값**을 반영해서 파일들을 생성/수정해줘.

---

### 1. 프로젝트 구조

```
프로젝트루트/
├── backend/              # Spring Boot (Gradle, Java 21)
│   ├── Dockerfile
│   ├── build.gradle
│   ├── settings.gradle
│   └── src/main/resources/
│       ├── application.properties
│       └── application-prod.properties   ← 없으면 생성
├── frontend/             # Next.js (Node 20, BFF 아키텍처)
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   └── app/
│       ├── api/[...path]/route.ts   # BFF 프록시 (API_BASE_URL 사용)
│       └── lib/session.ts           # iron-session (SESSION_SECRET 사용)
├── docker-compose.yml
├── .env.example
├── .gitignore
└── .github/
    └── workflows/
        └── deploy.yml               ← 없으면 생성
```

### 2. 아키텍처

```
브라우저
  │  http://<서버IP>:<FRONTEND_PORT>
  ▼
┌──────────────────┐
│  frontend        │  Next.js (BFF 패턴)
│  포트: 3001(내부) │  클라이언트 → /api/* → Next.js 서버가 백엔드로 프록시
│                  │  환경변수 API_BASE_URL 로 백엔드 주소 지정
└───────┬──────────┘
        │  http://backend:8081  (Docker 내부 네트워크)
        ▼
┌──────────────────┐
│  backend         │  Spring Boot
│  포트: 8081(내부) │  JWT 인증, REST API
└───────┬──────────┘
        │  jdbc:postgresql://db:5432/ncafedb
        ▼
┌──────────────────┐
│  db              │  PostgreSQL 17
│  포트: 5432(내부) │  profile "with-db"로 선택적 실행
└──────────────────┘
```

**핵심 포인트:**
- 컨테이너 **내부 포트**는 모두 고정 (frontend=3001, backend=8081, db=5432)
- **외부 포트**만 사용자별로 다르게 매핑 (docker-compose의 ports 좌측)
- 프론트엔드 → 백엔드 통신은 Docker 내부 네트워크 (`http://backend:8081`) 사용
- 브라우저 → 프론트엔드만 외부 포트 사용

### 3. 배포 인프라

- **서버**: 공용 서버 1대 (여러 사용자가 같은 서버 공유)
- **Runner**: GitHub Actions Self-Hosted Runner (서버에 이미 설치되어 있음)
- **컨테이너**: Docker Compose로 3개 서비스 관리
- **트리거**: master 브랜치 push 시 자동 배포 + 수동 배포(workflow_dispatch)

### 4. 사용자별로 달라지는 값

| 항목 | 설명 | 예시 |
|---|---|---|
| `USER_ID` | 컨테이너 이름 prefix (다른 사람과 겹치면 안 됨) | `hong`, `kim` |
| `COMPOSE_PROJECT_NAME` | Docker Compose 프로젝트 이름 (겹치면 안 됨) | `hong_ncafe` |
| `FRONTEND_PORT` | 프론트엔드 외부 포트 | `3001`, `3002`, `3003` |
| `BACKEND_PORT` | 백엔드 외부 포트 | `8081`, `8082`, `8083` |
| `DB_PORT` | DB 외부 포트 | `5432`, `5433`, `5434` |
| `SESSION_SECRET` | iron-session 암호화 키 (32자 이상) | 랜덤 생성 |

### 5. 생성/수정해야 할 파일들

아래 파일들을 확인하고, 없으면 생성, 있으면 수정해줘.

---

#### 5-1. `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [ master ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Create .env file
        run: |
          echo "COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-<기본_COMPOSE_PROJECT_NAME>}" > .env
          echo "USER_ID=${USER_ID:-<기본_USER_ID>}" >> .env
          echo "BACKEND_PORT=${BACKEND_PORT:-<기본_BACKEND_PORT>}" >> .env
          echo "FRONTEND_PORT=${FRONTEND_PORT:-<기본_FRONTEND_PORT>}" >> .env
          echo "DB_PORT=${DB_PORT:-<기본_DB_PORT>}" >> .env
          echo "SESSION_SECRET=${SESSION_SECRET:-<기본_SESSION_SECRET>}" >> .env
        env:
          COMPOSE_PROJECT_NAME: ${{ secrets.COMPOSE_PROJECT_NAME }}
          USER_ID: ${{ secrets.USER_ID }}
          BACKEND_PORT: ${{ secrets.BACKEND_PORT }}
          FRONTEND_PORT: ${{ secrets.FRONTEND_PORT }}
          DB_PORT: ${{ secrets.DB_PORT }}
          SESSION_SECRET: ${{ secrets.SESSION_SECRET }}

      - name: Build and Deploy
        run: docker compose --profile with-db up --build -d

      - name: Verify deployment
        run: |
          echo "=== Container Status ==="
          docker compose ps
          sleep 15
          echo ""
          echo "=== Health Check ==="
          curl -sf --max-time 10 -o /dev/null -w "Backend  : HTTP %{http_code}\n" http://localhost:${BACKEND_PORT:-<기본_BACKEND_PORT>} || echo "Backend  : not responding"
          curl -sf --max-time 10 -o /dev/null -w "Frontend : HTTP %{http_code}\n" http://localhost:${FRONTEND_PORT:-<기본_FRONTEND_PORT>} || echo "Frontend : not responding"
        env:
          BACKEND_PORT: ${{ secrets.BACKEND_PORT }}
          FRONTEND_PORT: ${{ secrets.FRONTEND_PORT }}

      - name: Clean up old images
        run: docker image prune -f
```

**위 템플릿에서 `<기본_XXX>` 부분을 내가 알려줄 값으로 치환해줘.**

---

#### 5-2. `docker-compose.yml`

```yaml
services:
  backend:
    image: ${BACKEND_IMAGE:-ncafe-backend:latest}
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ${USER_ID:-<기본_USER_ID>}-backend
    ports:
      - "${BACKEND_PORT:-<기본_BACKEND_PORT>}:8081"
    volumes:
      - ./upload:/app/upload
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL:-jdbc:postgresql://db:5432/ncafedb}
    restart: unless-stopped
    depends_on:
      - db

  frontend:
    image: ${FRONTEND_IMAGE:-ncafe-frontend:latest}
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ${USER_ID:-<기본_USER_ID>}-frontend
    ports:
      - "${FRONTEND_PORT:-<기본_FRONTEND_PORT>}:3001"
    environment:
      - API_BASE_URL=http://backend:8081
      - SESSION_SECRET=${SESSION_SECRET:-default-session-secret-change-me-in-production}
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:17
    profiles: [ "with-db" ]
    container_name: ${USER_ID:-<기본_USER_ID>}-db
    environment:
      POSTGRES_DB: ncafedb
      POSTGRES_USER: ncafe
      POSTGRES_PASSWORD: new_ibm2
    ports:
      - "${DB_PORT:-<기본_DB_PORT>}:5432"
    volumes:
      - ./data:/var/lib/postgresql/data
    restart: unless-stopped
```

**주의사항:**
- `ports`의 콜론 **왼쪽**만 사용자별 외부 포트, **오른쪽**은 컨테이너 내부 포트(고정)
- `API_BASE_URL=http://backend:8081` — 이것은 Docker 내부 네트워크 주소이므로 **절대 변경하지 마세요**
- `<기본_XXX>` 를 내가 알려줄 값으로 치환

---

#### 5-3. `backend/src/main/resources/application-prod.properties`

이 파일이 없으면 반드시 생성해줘. 프로덕션에서 테이블이 매번 삭제되는 것을 방지함.

```properties
# === Production Profile ===
# docker-compose에서 SPRING_PROFILES_ACTIVE=prod 로 활성화됨

# JPA: 테이블을 자동 삭제하지 않고, 스키마 변경만 반영
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

---

#### 5-4. `.env.example`

```
# 프로젝트 식별 (다른 사용자와 겹치지 않게)
COMPOSE_PROJECT_NAME=<기본_COMPOSE_PROJECT_NAME>
USER_ID=<기본_USER_ID>

# 포트 설정 (배정받은 포트 입력)
BACKEND_PORT=<기본_BACKEND_PORT>
FRONTEND_PORT=<기본_FRONTEND_PORT>
DB_PORT=<기본_DB_PORT>

# 보안 (프로덕션에서 반드시 변경)
SESSION_SECRET=<기본_SESSION_SECRET>
```

---

#### 5-5. `.gitignore` 확인

아래 항목들이 `.gitignore`에 포함되어 있는지 확인하고, 없으면 추가해줘:

```
.env
.env.*
```

---

#### 5-6. `backend/Dockerfile` 확인

이미 있으면 건드리지 마. 없으면 아래 내용으로 생성:

```dockerfile
# Build stage
FROM gradle:8.5.0-jdk21 AS builder
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew bootJar --no-daemon -x test --max-workers=1 -Dorg.gradle.jvmargs="-Xmx1g"

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8081

RUN mkdir -p /app/upload
VOLUME /app/upload
ENTRYPOINT ["java", "-Dserver.port=8081", "-jar", "app.jar"]
```

---

#### 5-7. `frontend/Dockerfile` 확인

이미 있으면 건드리지 마. 없으면 아래 내용으로 생성:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3001

ENV PORT 3001
CMD ["sh", "-c", "npm start -- -p 3001"]
```

---

### 6. 주요 브랜치 확인

배포 워크플로우의 트리거 브랜치와 실제 Git 브랜치가 **반드시 일치**해야 해.
`git branch` 명령으로 현재 브랜치를 확인하고, `deploy.yml`의 `branches: [ ]` 안의 값과 맞춰줘.

예: 현재 브랜치가 `master`이면 → `branches: [ master ]`
예: 현재 브랜치가 `main`이면 → `branches: [ main ]`

---

### 7. 프론트엔드 BFF 프록시 확인

프론트엔드 코드에서 백엔드 API를 호출하는 부분 (`app/api/[...path]/route.ts`, `app/api/auth/*/route.ts` 등)이
`process.env.API_BASE_URL`을 사용하는지 확인해줘.

```typescript
// 이렇게 되어 있어야 함:
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8081';
```

이 값은 Docker에서 실행될 때 docker-compose의 environment로 `http://backend:8081`이 주입됨.
로컬 개발 시에는 fallback인 `http://localhost:8081`이 사용됨.

---

### 8. GitHub Secrets 설정 안내

작업이 끝나면, 다음 Secrets를 GitHub 저장소에 등록하라고 안내해줘:

> 저장소 → Settings → Secrets and variables → Actions → New repository secret

| Secret 이름 | 값 |
|---|---|
| `SESSION_SECRET` | 32자 이상의 랜덤 문자열 (**필수**) |
| `COMPOSE_PROJECT_NAME` | (선택) 기본값과 다를 때만 |
| `USER_ID` | (선택) 기본값과 다를 때만 |
| `BACKEND_PORT` | (선택) 기본값과 다를 때만 |
| `FRONTEND_PORT` | (선택) 기본값과 다를 때만 |
| `DB_PORT` | (선택) 기본값과 다를 때만 |

---

### 9. 작업 완료 후 체크리스트

모든 작업이 끝나면 아래 항목을 확인하고 결과를 알려줘:

- [ ] `.github/workflows/deploy.yml` 생성/수정 완료
- [ ] `deploy.yml`의 트리거 브랜치가 실제 Git 브랜치와 일치
- [ ] `docker-compose.yml` — frontend에 `API_BASE_URL=http://backend:8081` 설정됨
- [ ] `docker-compose.yml` — frontend에 `SESSION_SECRET` 설정됨
- [ ] `docker-compose.yml` — ports의 외부 포트에 사용자 포트 반영됨
- [ ] `docker-compose.yml` — container_name에 USER_ID 반영됨
- [ ] `backend/src/main/resources/application-prod.properties` 존재 (ddl-auto=update)
- [ ] `.env.example` 업데이트 완료
- [ ] `.gitignore`에 `.env` 포함 확인
- [ ] GitHub Secrets 등록 안내 완료

---

### 여기에 나의 설정값을 입력하세요

```
USER_ID=young
COMPOSE_PROJECT_NAME=young_ncafe
FRONTEND_PORT=3031
BACKEND_PORT=8031
DB_PORT=5431
SESSION_SECRET=
```
