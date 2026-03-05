# 1단계: 빌드 스테이지
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Gradle Wrapper 및 설정 파일 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# 권한 부여 및 의존성 캐싱
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# 가장 용량이 큰 jar 파일을 app.jar로 사용 (실행형 jar가 plain.jar보다 훨씬 큽니다)
RUN JAR_FILE=$(find build/libs -name "*.jar" -exec ls -S {} + | head -n 1) && \
    cp "$JAR_FILE" app.jar && \
    [ -f app.jar ] || exit 1

# 2단계: 실행 스테이지
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 빌드 스테이지에서 준비된 app.jar를 복사합니다.
COPY --from=builder /app/app.jar app.jar

# 파일 업로드 설정
RUN mkdir -p /app/upload
VOLUME /app/upload

ENV SERVER_PORT=8081
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=8080", "-jar", "app.jar"]