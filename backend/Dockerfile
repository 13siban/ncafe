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

# 소스 복사 및 빌드 (결과물 파일명을 강제 지정하면 더 안전합니다)
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# 2단계: 실행 스테이지
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# [수정] 패턴 매칭 대신 빌드된 모든 jar 중 가장 큰 실행형 jar 하나를 가져오도록 수정하거나,
# 아래와 같이 명시적인 위치를 지정합니다.
# 보통 Gradle 빌드 결과물은 build/libs/ 폴더에 생성됩니다.
# Gradle 빌드 시 생성되는 실행 가능한 jar만 복사 (plain.jar 제외)
COPY --from=builder /app/build/libs/*[!plain].jar app.jar

# 파일 업로드 설정
RUN mkdir -p /app/upload
VOLUME /app/upload

ENV SERVER_PORT=8081
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=8080", "-jar", "app.jar"]