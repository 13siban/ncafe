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

# 소스 복사 및 빌드
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# 빌드된 결과물 중 실행 가능한 jar를 찾아서 이름을 고정합니다. (plain.jar 제외)
RUN mv build/libs/*[!plain].jar build/libs/app.jar

# 2단계: 실행 스테이지
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 빌드 스테이지에서 이름을 고정한 app.jar만 가져옵니다.
COPY --from=builder /app/build/libs/app.jar app.jar

# 파일 업로드 설정
RUN mkdir -p /app/upload
VOLUME /app/upload

ENV SERVER_PORT=8081
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=8080", "-jar", "app.jar"]