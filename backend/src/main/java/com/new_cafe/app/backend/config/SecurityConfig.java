package com.new_cafe.app.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;

import com.new_cafe.app.backend.config.security.JwtAuthenticationFilter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(org.springframework.security.config.Customizer.withDefaults()) // Use CORS settings from WebMvcConfigurer
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // 공개 API: 인증 없이 접근 가능
                    .requestMatchers("/auth/**", "/api/auth/**").permitAll()
                    .requestMatchers("/menus/**", "/api/menus/**").permitAll()
                    .requestMatchers("/categories/**", "/api/categories/**").permitAll()
                    .requestMatchers("/notice-popups/**", "/api/notice-popups/**").permitAll()
                    .requestMatchers("/grades/public", "/api/grades/public").permitAll()
                    .requestMatchers("/gallery/public", "/api/gallery/public").permitAll()
                    .requestMatchers("/**/*.png", "/**/*.jpg", "/**/*.jpeg", "/**/*.gif", "/**/*.svg", "/**/*.webp").permitAll()
                    .requestMatchers("/upload/**").permitAll()
                    .requestMatchers("/store/status", "/api/store/status").permitAll()
                    // 주문 API: 비회원 주문/조회가 필요하므로 permitAll 유지
                    // 회원 주문 조회 시 본인 확인은 OrderController에서 런타임 체크
                    .requestMatchers("/orders/**", "/api/orders/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/users/me/restore", "/api/users/me/restore").permitAll()

                    // 관리자 API: ADMIN 권한이 있는 사용자만 접근 가능
                    .requestMatchers(HttpMethod.PUT, "/admin/users/**", "/api/admin/users/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/admin/users/**", "/api/admin/users/**").hasRole("ADMIN")
                    .requestMatchers("/admin/**", "/api/admin/**").hasAnyRole("ADMIN", "SUB_ADMIN")
                    
                    // 에러 페이지 접근 허용 (상세 에러메시지 전달을 위함)
                    .requestMatchers("/error").permitAll()

                    // 그 외 모든 요청은 인증 필요
                    .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
