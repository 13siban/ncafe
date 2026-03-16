package com.new_cafe.app.backend.auth.application.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.new_cafe.app.backend.auth.application.port.in.GoogleLoginUseCase;
import com.new_cafe.app.backend.auth.application.port.in.LoginUseCase;
import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.auth.application.port.out.SaveUserPort;
import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.config.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleLoginService implements GoogleLoginUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.security.oauth2.client.registration.google.client-id:YOUR_GOOGLE_CLIENT_ID}")
    private String googleClientId;

    @Override
    @Transactional
    public LoginUseCase.Result loginWithGoogle(Command command) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new JacksonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            // FIXME: 실제 환경에서는 verify()를 통해 토큰을 검증해야 합니다.
            // 개발자 참고용: 발급받은 클라이언트 ID로 설정되어 있지 않은 경우 검증을 우회하려면 
            // idTokenObj = GoogleIdToken.parse(new JacksonFactory(), command.getIdToken()); 처럼 사용하기도 하지만
            // 보안상 위험하므로 반드시 검증을 거쳐야 합니다.
            GoogleIdToken idTokenObj = verifier.verify(command.getIdToken());
            if (idTokenObj == null) {
                // 클라이언트 ID 불일치 등 검증 실패 시
                System.out.println("Google ID Token validation failed. Token: " + command.getIdToken());
                System.out.println("Expected Aud Client ID: " + googleClientId);
                throw new RuntimeException("유효하지 않은 구글 토큰이거나 클라이언트 ID가 일치하지 않습니다.");
            }

            GoogleIdToken.Payload payload = idTokenObj.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String subjectId = payload.getSubject(); // Google's unique ID

            // 구글 소셜 로그인은 google_{subjectId} 로 username을 지정
            String username = "google_" + subjectId;

            Optional<User> userOptional = loadUserPort.loadUser(username);
            User user;

            if (userOptional.isEmpty()) {
                // 이메일이 이미 일반 회원으로 등록되어 있을 수 있지만, 
                // 여기서는 소셜 로그인 전용 계정을 신규 생성합니다. 
                String dummyPassword = passwordEncoder.encode(UUID.randomUUID().toString());
                user = User.builder()
                        .id(UUID.randomUUID().toString())
                        .username(username)
                        .nickname(name != null ? name : "GoogleUser")
                        .email(email)
                        .password(dummyPassword) 
                        .role("ROLE_USER")
                        .grade("GREEN_BEAN")
                        .isEnabled(true)
                        .build();
                saveUserPort.saveUser(user);
            } else {
                user = userOptional.get();
                if (!user.isEnabled()) {
                    throw new RuntimeException("계정이 잠겨 있습니다.");
                }
                if (user.getDeletedAt() != null) {
                    long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                            LocalDateTime.now(), user.getDeletedAt().plusDays(30));
                    if (daysRemaining <= 0) {
                        throw new RuntimeException("탈퇴 처리가 완료된 계정입니다.");
                    }
                    String deletedDate = user.getDeletedAt().toLocalDate().toString();
                    throw new RuntimeException("ACCOUNT_DELETED|" + deletedDate + "|" + daysRemaining);
                }
            }

            // Authentication 객체 생성 후 JWT 발급
            Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            String token = jwtTokenProvider.generateToken(authentication);

            String role = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_USER");

            return LoginUseCase.Result.builder()
                    .token(token)
                    .username(user.getUsername())
                    .role(role)
                    .build();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("구글 로그인 실패: " + e.getMessage());
        }
    }
}
