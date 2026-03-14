# 🔒 Docker 내부 포트 전환 제안서

> **작성일**: 2026-03-13  
> **작성자**: young  
> **대상**: ncafe 프로젝트 개발팀 전원  
> **상태**: 제안 (Review 필요)

---

## 📋 목차

1. [현재 상황 분석](#1-현재-상황-분석)
2. [문제점](#2-문제점)
3. [제안: 내부 포트 전환](#3-제안-내부-포트-전환)
4. [환경별 포트 전략](#4-환경별-포트-전략)
5. [마이그레이션 가이드](#5-마이그레이션-가이드)
6. [변경 전후 비교](#6-변경-전후-비교)
7. [FAQ](#7-faq)
8. [체크리스트](#8-체크리스트)

---

## 1. 현재 상황 분석

### 1.1 프로젝트 서비스 구성

| 서비스 | 기술 스택 | 컨테이너 내부 포트 | 역할 |
|---------|-----------|-------------------|------|
| **frontend** | Next.js | 3000 | 사용자 UI |
| **backend** | Spring Boot | 8080 | REST API |
| **agent** | FastAPI (uvicorn) | 8000 | AI 챗봇 에이전트 |
| **db** | PostgreSQL | 5432 | 데이터베이스 |

### 1.2 현재 문제가 되는 설정

현재 `docker-compose.yml`(서버 배포용)에서 **프론트엔드만** 외부 포트를 열어야 하지만, 일부 동료 개발자의 설정에서는 backend, agent, db 포트까지 모두 호스트에 노출되어 있습니다.

**현재 서버의 `docker ps` 상태 (문제 상황):**

```
CONTAINER ID   IMAGE              PORTS                              NAMES
xxxx           ncafe-frontend     0.0.0.0:3031->3000/tcp             xxx-frontend
xxxx           ncafe-backend      0.0.0.0:8080->8080/tcp    ❌       xxx-backend
xxxx           ncafe-agent        0.0.0.0:8000->8000/tcp    ❌       xxx-agent
xxxx           ncafe-db           0.0.0.0:5432->5432/tcp    ❌       xxx-db
```

> [!WARNING]
> backend(8080), agent(8000), db(5432) 포트가 `0.0.0.0`으로 호스트에 바인딩되어 있어, 서버의 방화벽 설정에 따라 외부에서 직접 접근이 가능합니다.

---

## 2. 문제점

### 2.1 보안 위험

| 위험 요소 | 설명 | 심각도 |
|-----------|------|--------|
| **DB 직접 접근** | PostgreSQL 5432 포트가 외부에 노출되면 무차별 대입 공격의 대상이 됨 | 🔴 **심각** |
| **API 직접 호출** | 프론트엔드를 거치지 않고 백엔드 API에 직접 접근 가능 | 🟠 **높음** |
| **Agent 직접 접근** | AI 에이전트 서버에 직접 접근하여 비정상적 요청 가능 | 🟠 **높음** |

### 2.2 운영 문제

- **포트 충돌**: 서버에서 여러 프로젝트를 운영할 때, 동일 포트(8080, 5432 등)를 사용하면 충돌 발생
- **리소스 낭비**: 불필요한 포트 바인딩은 네트워크 리소스를 낭비
- **관리 복잡도 증가**: `docker ps`에서 불필요한 포트 매핑이 혼란을 야기

### 2.3 Docker 네트워크 이해 부족

Docker Compose로 실행된 서비스들은 **동일한 내부 네트워크**에 속하므로, 컨테이너 간 통신은 **서비스 이름(backend, db 등)**으로 가능합니다. 외부 포트를 열 필요가 없습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Internal Network                   │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ frontend │───▶│ backend  │───▶│    db    │    │ agent  │ │
│  │  :3000   │    │  :8080   │    │  :5432   │    │ :8000  │ │
│  └────┬─────┘    └──────────┘    └──────────┘    └────────┘ │
│       │              ❌               ❌             ❌       │
│       │          호스트 노출 불필요   호스트 노출 불필요        │
└───────┼─────────────────────────────────────────────────────┘
        │
        ▼  ✅ 유일하게 외부 노출 필요
   호스트:${FRONTEND_PORT} ──▶ 사용자 브라우저
```

---

## 3. 제안: 내부 포트 전환

### 3.1 핵심 원칙

> **"프론트엔드를 제외한 모든 서비스는 Docker 내부 네트워크에서만 통신한다."**

| 서비스 | 외부 포트 노출 | 이유 |
|--------|:-------------:|------|
| **frontend** | ✅ 필요 | 사용자가 브라우저로 직접 접속해야 함 |
| **backend** | ❌ 불필요 | frontend 컨테이너에서 `http://backend:8080`으로 내부 통신 |
| **agent** | ❌ 불필요 | frontend 컨테이너에서 `http://agent:8000`으로 내부 통신 |
| **db** | ❌ 불필요 | backend/agent 컨테이너에서 `db:5432`로 내부 통신 |

### 3.2 이미 올바르게 설정된 부분

현재 `docker-compose.yml`에서 frontend의 `environment`를 보면:

```yaml
environment:
  - API_BASE_URL=http://backend:8080      # ✅ 내부 서비스 이름 사용
  - CHAT_SERVER_URL=http://agent:8000     # ✅ 내부 서비스 이름 사용
```

backend의 DB 연결도:

```yaml
environment:
  - DB_URL=jdbc:postgresql://db:5432/ncafedb  # ✅ 내부 서비스 이름 사용
```

**즉, 코드 레벨에서는 이미 내부 통신을 하고 있으므로, `ports` 설정만 제거하면 됩니다.**

---

## 4. 환경별 포트 전략

### 4.1 서버 배포 환경 (`docker-compose.yml`)

서버 배포 시에는 **프론트엔드만** 외부 포트를 열어야 합니다.

```yaml
services:
  # ── 백엔드 (Spring Boot) ──
  backend:
    # ...
    # ❌ ports 섹션 없음 (내부 통신만 사용)

  # ── 프론트엔드 (Next.js) ──
  frontend:
    # ...
    ports:
      - "${FRONTEND_PORT}:3000"    # ✅ 유일하게 외부 노출

  # ── AI 에이전트 (FastAPI) ──
  agent:
    # ...
    # ❌ ports 섹션 없음 (내부 통신만 사용)

  # ── 데이터베이스 (PostgreSQL) ──
  db:
    # ...
    # ❌ ports 섹션 없음 (내부 통신만 사용)
```

### 4.2 로컬 개발 환경 (`docker-compose.local.yml` 또는 `docker-compose.override.yml`)

로컬 개발 시에는 디버깅/테스트 목적으로 포트를 열 수 있지만, **환경변수로 제어**합니다.

```yaml
services:
  backend:
    ports:
      - "${LOCAL_BACKEND_PORT:-8080}:8080"    # 로컬 디버깅용 (선택)

  agent:
    ports:
      - "${LOCAL_AGENT_PORT:-8000}:8000"      # 로컬 디버깅용 (선택)

  db:
    ports:
      - "${LOCAL_DB_PORT:-5432}:5432"         # DBeaver 등 DB 클라이언트용 (선택)
```

### 4.3 `.env` 설정 가이드

#### 서버 배포용 `.env`

```env
# 프로젝트 식별
COMPOSE_PROJECT_NAME=young-ncafe
USER_ID=young

# ✅ 프론트엔드만 외부 포트 지정
FRONTEND_PORT=3031

# ❌ 아래 변수들은 서버에서 사용하지 않음 (비워두거나 삭제)
# LOCAL_BACKEND_PORT=
# LOCAL_DB_PORT=
# LOCAL_AGENT_PORT=
```

#### 로컬 개발용 `.env`

```env
# 프로젝트 식별
COMPOSE_PROJECT_NAME=young-ncafe
USER_ID=young

# 프론트엔드 포트
FRONTEND_PORT=3031

# 로컬 개발용 포트 (필요 시 설정)
LOCAL_BACKEND_PORT=8080
LOCAL_DB_PORT=5432
LOCAL_AGENT_PORT=8000
```

---

## 5. 마이그레이션 가이드

### Step 1: `docker-compose.yml` 수정 (서버 배포용)

backend, agent, db 서비스에서 `ports` 섹션을 **완전히 제거**합니다.

```diff
  # ── 백엔드 (Spring Boot) ──
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: ${USER_ID}-ncafe-backend
    container_name: ${USER_ID}-backend
-   ports:
-     - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_URL=jdbc:postgresql://db:5432/ncafedb
```

```diff
  # ── AI 에이전트 (FastAPI) ──
  agent:
    build:
      context: ./agent-server
      dockerfile: Dockerfile
    image: ${USER_ID}-ncafe-agent
    container_name: ${USER_ID}-agent
-   ports:
-     - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
```

```diff
  # ── 데이터베이스 (PostgreSQL) ──
  db:
    build:
      context: ./db
      dockerfile: Dockerfile
    image: ${USER_ID}-ncafe-db
    container_name: ${USER_ID}-db
-   ports:
-     - "5432:5432"
    environment:
      - PGPORT=5432
```

### Step 2: `docker-compose.override.yml` 수정 (로컬 개발용)

로컬 개발 시 필요한 포트만 override 파일에서 열어줍니다.

```yaml
# docker-compose.override.yml - 로컬 개발 환경 전용
# 이 파일은 로컬에서 docker-compose up 시 자동으로 적용됩니다.
# ⚠️ 서버에서는 이 파일이 존재하지 않아야 합니다.

services:
  backend:
    environment:
      - SPRING_PROFILES_ACTIVE=dev
    volumes:
      - ./data/upload:/app/upload
    ports:
      - "${LOCAL_BACKEND_PORT:-8080}:8080"

  agent:
    ports:
      - "${LOCAL_AGENT_PORT:-8000}:8000"

  db:
    volumes:
      - ./data/db:/var/lib/postgresql/data
    ports:
      - "${LOCAL_DB_PORT:-5432}:5432"

  frontend:
    ports:
      - "3001:3000"
```

### Step 3: `.env` 파일 업데이트

**`.env.example` 수정 → 팀원 모두에게 공유:**

```env
# ============================================================
# ncafe 환경 변수 설정
# ============================================================
# 이 파일을 .env로 복사한 후 값을 채워 사용하세요.
# cp .env.example .env
# ============================================================

# ── 프로젝트 식별 ──
# 다른 사용자와 컨테이너 이름 충돌 방지를 위해 본인 이름 사용
COMPOSE_PROJECT_NAME=<your-name>-ncafe
USER_ID=<your-name>

# ── 포트 설정 ──
# 프론트엔드: 유일하게 외부 노출이 필요한 포트 (필수)
FRONTEND_PORT=<할당받은 포트번호>

# 로컬 개발용 포트 (서버 배포 시에는 사용하지 않음)
# docker-compose.override.yml에 의해 로컬에서만 적용됨
# LOCAL_BACKEND_PORT=8080
# LOCAL_DB_PORT=5432
# LOCAL_AGENT_PORT=8000

# ── 데이터베이스 설정 ──
DB_URL=jdbc:postgresql://db:5432/ncafedb
POSTGRES_DB=ncafedb
DB_USERNAME=ncafe
DB_PASSWORD=<strong-password>

# ── 보안 ──
SESSION_SECRET=<random-string>
JWT_SECRET=<random-string>
SESSION_SECURE=false

# ── AI 에이전트 ──
# GEMINI_API_KEY=
# GEMINI_MODEL=

# ── 타임존 ──
TZ=Asia/Seoul
```

### Step 4: 서버에서 재배포

```bash
# 1. 기존 컨테이너 중지 및 삭제
docker compose down

# 2. docker-compose.override.yml이 서버에 없는지 확인
#    (서버에서는 override 파일이 없어야 함)
ls docker-compose.override.yml  # 파일이 있으면 삭제 또는 이름 변경

# 3. 새로운 설정으로 재시작
docker compose up -d --build

# 4. 포트 노출 상태 확인
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Step 5: 검증

재배포 후 `docker ps`에서 다음과 같이 보여야 합니다:

```
NAMES             PORTS
xxx-frontend      0.0.0.0:3031->3000/tcp    ✅ 유일한 외부 포트
xxx-backend       8080/tcp                   ✅ 내부 포트만 (EXPOSE)
xxx-agent         8000/tcp                   ✅ 내부 포트만 (EXPOSE)
xxx-db            5432/tcp                   ✅ 내부 포트만 (EXPOSE)
```

> [!IMPORTANT]
> `0.0.0.0:포트->포트` 형태가 아닌, 포트 번호만 표시되면 내부 포트로만 동작하는 것입니다.

---

## 6. 변경 전후 비교

### Before (현재 - 문제 상태)

```
┌─────────────────────────────────────────────────┐
│                 Host Machine                     │
│                                                  │
│   :3031 ──▶ frontend:3000    ✅                  │
│   :8080 ──▶ backend:8080     ❌ 불필요한 노출     │
│   :8000 ──▶ agent:8000       ❌ 불필요한 노출     │
│   :5432 ──▶ db:5432          ❌ 보안 위험         │
│                                                  │
│   외부에서 접근 가능한 포트: 4개                    │
└─────────────────────────────────────────────────┘
```

### After (변경 후 - 목표 상태)

```
┌─────────────────────────────────────────────────┐
│                 Host Machine                     │
│                                                  │
│   :3031 ──▶ frontend:3000    ✅ 사용자 접속용     │
│                                                  │
│   ┌─── Docker Internal Network ───┐              │
│   │                               │              │
│   │  frontend ──▶ backend:8080    │              │
│   │  frontend ──▶ agent:8000      │              │
│   │  backend  ──▶ db:5432         │              │
│   │  agent    ──▶ db:5432         │              │
│   │                               │              │
│   └───────────────────────────────┘              │
│                                                  │
│   외부에서 접근 가능한 포트: 1개 (프론트엔드만)     │
└─────────────────────────────────────────────────┘
```

---

## 7. FAQ

### Q1: 로컬에서 DBeaver로 DB에 접속하려면 어떻게 하나요?

`docker-compose.override.yml`이 있는 로컬 환경에서는 `LOCAL_DB_PORT`로 설정한 포트로 접속이 가능합니다. 서버에서는 DB 포트를 열지 않으므로 SSH 터널링을 사용하세요:

```bash
# SSH 터널링으로 서버 DB 접속
ssh -L 5432:localhost:5432 user@server-ip
# 이후 DBeaver에서 localhost:5432로 접속
```

또는 Docker exec으로 직접 접속:

```bash
docker exec -it <컨테이너명>-db psql -U ncafe -d ncafedb
```

### Q2: 로컬에서 Postman으로 백엔드 API를 테스트하려면?

`docker-compose.override.yml`이 있으면 `LOCAL_BACKEND_PORT`로 설정한 포트로 접속 가능합니다. 또는 로컬에서는 도커 없이 직접 실행(`./gradlew bootRun`)하는 것을 권장합니다.

### Q3: 서버에서 외부 포트를 열 수는 없나요?

특별한 사유가 있는 경우 `docker-compose.local.yml` 또는 별도 override 파일을 사용할 수 있지만, **기본 배포(`docker-compose.yml`)에서는 프론트엔드만 포트를 열어야** 합니다.

### Q4: `expose`와 `ports`의 차이는 무엇인가요?

| 속성 | 설명 | 외부 접근 |
|------|------|:---------:|
| `expose` | 도커 내부 네트워크에서만 포트를 노출 (문서화 목적) | ❌ |
| `ports` | 호스트 머신에 포트를 바인딩하여 외부 접근 허용 | ✅ |

> [!NOTE]
> Docker Compose에서 같은 네트워크에 있는 컨테이너들은 `expose`나 `ports` 없이도 서비스 이름으로 통신이 가능합니다. `expose`는 단지 문서화 목적이며, `ports`만이 실제로 호스트에 포트를 바인딩합니다.

### Q5: `docker-compose.override.yml`은 `.gitignore`에 넣어야 하나요?

**아닙니다.** `docker-compose.override.yml`은 팀 공용 로컬 설정이므로 Git에 포함시키는 것을 권장합니다. 개인별 차이가 필요한 부분은 `.env` 파일(`.gitignore`에 포함)에서 환경변수로 관리합니다.

---

## 8. 체크리스트

### 서버 배포 시 확인 사항

- [ ] `docker-compose.yml`에서 `frontend` 외의 서비스에 `ports` 섹션이 없는지 확인
- [ ] `docker-compose.override.yml`이 서버에 존재하지 않는지 확인
- [ ] `.env`에서 `LOCAL_BACKEND_PORT`, `LOCAL_DB_PORT`, `LOCAL_AGENT_PORT` 가 비어있거나 없는지 확인
- [ ] `docker ps`에서 프론트엔드만 `0.0.0.0:포트→포트` 형태로 나타나는지 확인
- [ ] 프론트엔드를 통한 정상 접속이 가능한지 확인
- [ ] 외부에서 `서버IP:8080`, `서버IP:8000`, `서버IP:5432`로 직접 접근이 차단되는지 확인

### 로컬 개발 환경 확인 사항

- [ ] `docker-compose.override.yml`이 프로젝트 루트에 존재하는지 확인
- [ ] `.env`에 로컬 포트 변수가 올바르게 설정되어 있는지 확인
- [ ] 필요한 서비스에 대한 로컬 포트 접근이 가능한지 확인

---

> [!TIP]
> 이 변경은 **코드 수정이 필요 없습니다.** 이미 컨테이너 간 통신은 Docker 내부 서비스 이름(`backend`, `db`, `agent`)을 사용하고 있으므로, Docker Compose 설정 파일의 `ports` 섹션만 조정하면 됩니다.
