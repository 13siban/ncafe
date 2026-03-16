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
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import java.util.Map;

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
            RestTemplate restTemplate = new RestTemplate();
            String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(command.getIdToken()); // We use idToken field to pass the generic token

            HttpEntity<String> entity = new HttpEntity<>("", headers);
            ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, entity, Map.class);
            
            Map<String, Object> payload = response.getBody();
            if (payload == null) {
                throw new RuntimeException("구글 사용자 정보를 가져오지 못했습니다.");
            }

            String email = (String) payload.get("email");
            String name = (String) payload.get("name");
            String subjectId = (String) payload.get("sub"); // Google's unique ID

            // 구글 소셜 로그인은 google_{subjectId} 로 username을 지정
            String username = "google_" + subjectId;

            Optional<User> userOptional = loadUserPort.loadUser(username);
            User user;
            boolean restored = false;

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
                    // 소셜 로그인은 비밀번호 확인이 불가하므로, 유예기간 내 로그인 시 자동 복구
                    user.restoreAccount();
                    saveUserPort.saveUser(user);
                    restored = true;
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
                    .accountRestored(restored)
                    .build();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("구글 로그인 실패: " + e.getMessage());
        }
    }
}
