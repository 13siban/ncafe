# 1단계: 빌드 스테이지 (Build Stage)
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# 빌드에 필요한 Gradle Wrapper 관련 파일들을 먼저 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# 실행 권한 부여 (WSL/Linux 환경 필수) 및 라이브러리 미리 다운로드 (캐싱)
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사 및 실제 빌드 진행
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# 2단계: 실행 스테이지 (Run Stage)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 빌드 스테이지에서 생성된 jar 파일만 추출하여 복사
# (*.jar 대신 구체적인 패턴을 써서 plain jar가 복사되는 것을 방지)
COPY --from=builder /app/build/libs/*[0-9].jar app.jar

# 파일 업로드를 위한 폴더 생성 및 볼륨 설정
RUN mkdir -p /app/upload
VOLUME /app/upload

# 환경 변수 및 포트 설정
ENV SERVER_PORT=8031
EXPOSE 8031

# 컨테이너 실행 시 자바 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "app.jar"]