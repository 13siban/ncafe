package com.new_cafe.app.backend.auth.adapter.out.persistence;

import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.auth.domain.model.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JdbcMemberAdapter implements LoadUserPort {

    private final DataSource dataSource;

    @Override
    public Optional<AuthUser> loadUser(String username) {
        // TODO: JDBC를 이용한 실제 유저 조회 로직 구현
        // SQL: SELECT * FROM members WHERE username = ?
        return Optional.empty();
    }
}
