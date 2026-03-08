package com.new_cafe.app.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import com.new_cafe.app.backend.config.security.JwtAuthenticationFilter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

@Configuration
@EnableWebSecurity
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
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers("/menus/**").permitAll()
                    .requestMatchers("/categories/**").permitAll()
                    .requestMatchers("/**/*.png", "/**/*.jpg", "/**/*.jpeg", "/**/*.gif", "/**/*.svg").permitAll()
                    .requestMatchers("/store/status").permitAll()
                    .requestMatchers("/orders/**").permitAll()

                    // 관리자 API: ADMIN 권한이 있는 사용자만 접근 가능
                    .requestMatchers("/admin/**").hasRole("ADMIN")
                    
                    // 에러 페이지 접근 허용 (상세 에러메시지 전달을 위함)
                    .requestMatchers("/error").permitAll()

                    // 그 외 모든 요청은 인증 필요
                    .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
