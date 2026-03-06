# 업로드 파일 스토리지 마이그레이션 가이드

## 문제 상황

현재 `docker-compose.yml` 설정:
```yaml
volumes:
  - ./backend/upload:/app/upload
```

### 발생하는 문제
- GitHub Actions로 배포 시 컨테이너 재생성
- `./backend/upload` 디렉토리가 초기화되어 **업로드된 파일이 모두 삭제됨**
- 사용자가 업로드한 이미지, 파일 등이 배포 시마다 손실

---

## 해결 방안 옵션

### 옵션 1: 호스트 절대 경로 마운트 (간단, 소규모)

#### 개요
호스트 서버의 사용자 홈 디렉토리에 업로드 폴더를 생성하고 마운트

#### 장점
- ✅ 구현이 매우 간단
- ✅ 추가 비용 없음
- ✅ 즉시 적용 가능
- ✅ 로컬 파일 시스템으로 빠른 접근

#### 단점
- ❌ 서버 디스크 용량에 의존
- ❌ 백업 전략 별도 필요
- ❌ 서버 마이그레이션 시 파일 이전 필요
- ❌ CDN 연동 불가능
- ❌ 다중 서버 환경에서 사용 불가

#### 적용 방법

**1. docker-compose.yml 수정**
```yaml
services:
  backend:
    volumes:
      - ${HOME}/upload:/app/upload  # 또는 /home/사용자명/upload:/app/upload
```

**2. GitHub Actions 워크플로우 수정**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            # 업로드 디렉토리 생성 (없으면)
            mkdir -p $HOME/upload
            chmod 755 $HOME/upload

            # 프로젝트 디렉토리로 이동
            cd /home/newlec/workspace/ncafe

            # 최신 코드 pull
            git pull origin master

            # Docker Compose로 재배포
            docker-compose down
            docker-compose up -d --build
```

**3. 서버에서 직접 설정 (SSH 접속)**
```bash
# 업로드 디렉토리 생성
mkdir -p ~/upload
chmod 755 ~/upload

# Docker 컨테이너의 UID 확인 후 권한 조정 (필요시)
sudo chown -R 1000:1000 ~/upload  # Spring Boot 기본 UID
```

**4. 백업 스크립트 설정 (권장)**

`backup-uploads.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf ~/upload-backup-$DATE.tar.gz ~/upload
# 오래된 백업 삭제 (30일 이상)
find ~/upload-backup-*.tar.gz -mtime +30 -delete
```

Crontab 등록:
```bash
crontab -e
# 매일 새벽 3시 백업
0 3 * * * /home/newlec/backup-uploads.sh
```

---

### 옵션 2: Docker Named Volume (중간, 권장)

#### 개요
Docker가 관리하는 Named Volume을 사용하여 데이터 영속성 보장

#### 장점
- ✅ Docker가 자동으로 디렉토리 생성 및 권한 관리
- ✅ 추가 비용 없음
- ✅ 컨테이너 재생성 시에도 데이터 유지
- ✅ 백업/복원이 Docker 명령어로 가능
- ✅ 설정이 명확하고 이식성 좋음

#### 단점
- ❌ 서버 디스크 용량에 의존
- ❌ 다중 서버 환경에서 복잡함
- ❌ CDN 연동 불가능
- ❌ 볼륨 위치가 숨겨져 있음 (`/var/lib/docker/volumes/`)

#### 적용 방법

**1. docker-compose.yml 수정**
```yaml
services:
  backend:
    image: ncafe-backend
    volumes:
      - upload-data:/app/upload
    # ... 기타 설정

volumes:
  upload-data:
    driver: local
```

**2. 특정 경로에 Named Volume 바인딩 (선택사항)**
```yaml
volumes:
  upload-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /home/newlec/upload  # 실제 저장 경로 지정
```

**3. GitHub Actions 워크플로우**
```yaml
- name: Deploy to server
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /home/newlec/workspace/ncafe
      git pull origin master

      # 기존 컨테이너만 재시작 (볼륨은 유지)
      docker-compose up -d --build
```

**4. 볼륨 관리 명령어**
```bash
# 볼륨 목록 확인
docker volume ls

# 볼륨 상세 정보 (실제 경로 확인)
docker volume inspect ncafe_upload-data

# 볼륨 백업
docker run --rm -v ncafe_upload-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/upload-backup.tar.gz /data

# 볼륨 복원
docker run --rm -v ncafe_upload-data:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/upload-backup.tar.gz -C /
```

---

### 옵션 3: AWS S3 (프로덕션, 확장성)

#### 개요
파일을 Amazon S3에 저장하고 Spring Boot에서 S3 SDK 사용

#### 장점
- ✅ 무제한 확장 가능
- ✅ 고가용성 및 내구성 (99.999999999%)
- ✅ CDN (CloudFront) 연동 가능
- ✅ 다중 서버 환경에서도 동일한 파일 접근
- ✅ 자동 백업 및 버전 관리
- ✅ 서버 독립적

#### 단점
- ❌ 비용 발생 (저장 용량 + 전송량 기준)
- ❌ 코드 수정 필요
- ❌ AWS 계정 및 설정 필요
- ❌ 네트워크 지연 가능 (로컬보다 느림)

#### 적용 방법

**1. AWS S3 버킷 생성**
```bash
# AWS CLI 설치 및 설정
aws configure

# S3 버킷 생성
aws s3 mb s3://ncafe-uploads --region ap-northeast-2

# 버킷 정책 설정 (Public Read 허용 - 선택사항)
```

**2. Spring Boot 의존성 추가**

`backend/build.gradle`:
```gradle
dependencies {
    implementation 'io.awspring.cloud:spring-cloud-aws-starter-s3:3.0.0'
    // ... 기타 의존성
}
```

**3. application.yml 설정**

`backend/src/main/resources/application.yml`:
```yaml
spring:
  cloud:
    aws:
      credentials:
        access-key: ${AWS_ACCESS_KEY_ID}
        secret-key: ${AWS_SECRET_ACCESS_KEY}
      region:
        static: ap-northeast-2
      s3:
        bucket: ncafe-uploads

# 기존 파일 업로드 설정은 제거 또는 주석 처리
# file:
#   upload-dir: ./upload
```

**4. FileService 수정**

`backend/src/main/java/com/.../service/FileService.java`:
```java
import io.awspring.cloud.s3.S3Template;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class FileService {

    private final S3Template s3Template;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucketName;

    public FileService(S3Template s3Template) {
        this.s3Template = s3Template;
    }

    public String uploadFile(MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String key = "uploads/" + fileName;

        // S3에 업로드
        s3Template.upload(bucketName, key, file.getInputStream());

        // 파일 URL 반환
        return String.format("https://%s.s3.ap-northeast-2.amazonaws.com/%s",
                           bucketName, key);
    }

    public void deleteFile(String fileUrl) {
        // URL에서 키 추출
        String key = fileUrl.substring(fileUrl.indexOf(".com/") + 5);
        s3Template.deleteObject(bucketName, key);
    }
}
```

**5. docker-compose.yml 환경변수 추가**
```yaml
services:
  backend:
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    # volumes 설정 제거
```

**6. GitHub Actions Secrets 설정**
```
Repository Settings → Secrets and variables → Actions

추가할 Secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
```

**7. GitHub Actions 워크플로우**
```yaml
- name: Deploy to server
  uses: appleboy/ssh-action@master
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    envs: AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY
    script: |
      cd /home/newlec/workspace/ncafe
      git pull origin master

      # 환경변수 전달하여 배포
      AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
      AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
      docker-compose up -d --build
```

**8. 비용 최적화 팁**
```bash
# S3 Lifecycle 정책 설정 (오래된 파일 자동 삭제)
# AWS Console → S3 → Bucket → Management → Lifecycle rules

# CloudFront CDN 연동으로 전송 비용 절감
# 자주 접근하는 파일은 캐싱되어 S3 요청 감소
```

---

### 옵션 4: MinIO (자체 호스팅 S3 호환)

#### 개요
Docker로 MinIO 서버를 띄워서 S3 호환 API 사용

#### 장점
- ✅ S3와 동일한 API (코드 재사용 가능)
- ✅ 자체 호스팅으로 비용 절감
- ✅ AWS 종속성 없음
- ✅ 다중 서버 환경 지원 가능

#### 단점
- ❌ MinIO 서버 관리 필요
- ❌ 별도의 백업 전략 필요
- ❌ 서버 리소스 추가 소비

#### 적용 방법

**1. docker-compose.yml에 MinIO 추가**
```yaml
services:
  backend:
    # ... 기존 설정
    environment:
      - AWS_ACCESS_KEY_ID=minioadmin
      - AWS_SECRET_ACCESS_KEY=minioadmin
      - AWS_ENDPOINT=http://minio:9000
      - SPRING_CLOUD_AWS_S3_BUCKET=ncafe-uploads
    depends_on:
      - minio

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"      # API
      - "9001:9001"      # Console
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"

volumes:
  minio-data:
    driver: local
```

**2. Spring Boot 설정**

`application.yml`:
```yaml
spring:
  cloud:
    aws:
      credentials:
        access-key: ${AWS_ACCESS_KEY_ID:minioadmin}
        secret-key: ${AWS_SECRET_ACCESS_KEY:minioadmin}
      region:
        static: us-east-1  # MinIO는 리전 무관
      s3:
        bucket: ${SPRING_CLOUD_AWS_S3_BUCKET:ncafe-uploads}
        endpoint: ${AWS_ENDPOINT:http://localhost:9000}
```

**3. MinIO 초기 설정**
```bash
# MinIO Console 접속: http://localhost:9001
# ID: minioadmin / PW: minioadmin

# 버킷 생성: ncafe-uploads
# Access Policy: public (또는 private)
```

**4. 프로덕션 보안 설정**
```yaml
# docker-compose.prod.yml
services:
  minio:
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}  # 안전한 사용자명
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}  # 안전한 비밀번호
```

---

## 옵션 비교표

| 항목 | 호스트 절대 경로 | Docker Named Volume | AWS S3 | MinIO |
|------|-----------------|---------------------|--------|-------|
| **구현 난이도** | ⭐ 쉬움 | ⭐⭐ 보통 | ⭐⭐⭐⭐ 어려움 | ⭐⭐⭐ 보통 |
| **비용** | 무료 | 무료 | 유료 | 무료 (서버 비용만) |
| **확장성** | ❌ 낮음 | ❌ 낮음 | ✅ 무제한 | ⚠️ 서버 의존 |
| **다중 서버** | ❌ 불가 | ❌ 복잡 | ✅ 가능 | ✅ 가능 |
| **CDN 연동** | ❌ 불가 | ❌ 불가 | ✅ 가능 | ⚠️ 별도 구성 |
| **백업 편의성** | ⚠️ 수동 | ⚠️ 수동 | ✅ 자동 | ⚠️ 수동 |
| **데이터 내구성** | ⚠️ 낮음 | ⚠️ 낮음 | ✅ 매우 높음 | ⚠️ 서버 의존 |
| **관리 복잡도** | ⭐ 단순 | ⭐ 단순 | ⭐⭐⭐ 복잡 | ⭐⭐ 보통 |

---

## 추천 시나리오

### 🏠 개인 프로젝트 / MVP
→ **옵션 1: 호스트 절대 경로** 또는 **옵션 2: Named Volume**
- 빠르게 구현 가능
- 추가 비용 없음
- 백업 스크립트만 잘 설정하면 충분

### 🏢 소규모 스타트업 / 사이드 프로젝트
→ **옵션 2: Named Volume** + 백업 전략
- Docker 생태계에서 깔끔한 관리
- 비용 절감하면서도 안정적

### 🚀 중대형 서비스 / 프로덕션
→ **옵션 3: AWS S3** + CloudFront
- 확장성 보장
- 고가용성 및 내구성
- CDN으로 전세계 빠른 접근

### 🔧 AWS 종속 회피 / 하이브리드
→ **옵션 4: MinIO**
- S3 호환 API로 나중에 마이그레이션 용이
- 자체 인프라 제어 가능

---

## 마이그레이션 체크리스트

### 배포 전
- [ ] 백업 전략 수립
- [ ] 기존 업로드 파일 백업
- [ ] 테스트 환경에서 검증
- [ ] 환경변수 및 Secrets 설정
- [ ] GitHub Actions 워크플로우 수정

### 배포 중
- [ ] 서비스 다운타임 공지 (필요시)
- [ ] 기존 파일 백업 확인
- [ ] 새 설정 적용
- [ ] 컨테이너 재시작

### 배포 후
- [ ] 파일 업로드 테스트
- [ ] 기존 파일 접근 테스트
- [ ] 배포 후 파일 유지 확인
- [ ] 백업 스크립트 동작 확인
- [ ] 모니터링 설정 (디스크 용량 등)

---

## 롤백 계획

### 문제 발생 시
1. **즉시 이전 docker-compose.yml로 복원**
   ```bash
   git checkout HEAD~1 docker-compose.yml
   docker-compose down
   docker-compose up -d
   ```

2. **백업 파일 복원**
   ```bash
   # 호스트 경로 방식
   tar -xzf upload-backup-YYYYMMDD.tar.gz -C ~/

   # Named Volume 방식
   docker run --rm -v ncafe_upload-data:/data -v $(pwd):/backup \
     ubuntu tar xzf /backup/upload-backup.tar.gz -C /
   ```

3. **S3 방식 롤백**
   - 이전 코드로 체크아웃
   - S3 버킷 데이터는 유지
   - 필요시 S3에서 로컬로 다운로드

---

## 추가 고려사항

### 보안
- 업로드 파일 타입 검증 (악성 파일 차단)
- 파일 크기 제한
- 안티바이러스 스캔 (프로덕션)
- 접근 권한 관리

### 성능
- 썸네일 자동 생성 (이미지)
- CDN 캐싱 전략
- Lazy Loading

### 모니터링
- 디스크 사용량 알림
- S3 비용 모니터링
- 업로드 실패율 추적

---

## 참고 자료

- [Docker Volumes 공식 문서](https://docs.docker.com/storage/volumes/)
- [AWS S3 Spring Boot Integration](https://docs.awspring.io/spring-cloud-aws/docs/current/reference/html/index.html)
- [MinIO 공식 문서](https://min.io/docs/minio/linux/index.html)
- [Spring Boot File Upload Best Practices](https://spring.io/guides/gs/uploading-files/)

---

**문서 버전**: 1.0
**최종 수정일**: 2026-03-06
**작성자**: Claude Code
