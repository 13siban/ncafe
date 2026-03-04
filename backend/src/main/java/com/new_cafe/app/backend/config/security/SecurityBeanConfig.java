package com.new_cafe.app.backend.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import javax.sql.DataSource;

@Configuration
public class SecurityBeanConfig {

    @Bean
    public UserDetailsService userDetailsService(DataSource dataSource) {
        JdbcUserDetailsManager manager = new JdbcUserDetailsManager(dataSource);
        
        // 유저 정보를 가져오는 쿼리 (사용자 ID, 비밀번호, 활성화 여부(enabled) 3개 컬럼 필수)
        manager.setUsersByUsernameQuery(
            "select nickname as username, password, true as enabled from users where nickname = ?"
        );
        
        // 권한(Role)을 가져오는 쿼리 (사용자 ID, 권한명)
        // DB에 ROLE_ 접두사가 있든 없든, 스프링 시큐리티 로직에 맞게 ROLE_을 붙여서 가져옵니다.
        manager.setAuthoritiesByUsernameQuery(
            "select nickname as username, " +
            "case when role like 'ROLE_%' then role else concat('ROLE_', role) end as authority " +
            "from users where nickname = ?"
        );
        
        return manager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
