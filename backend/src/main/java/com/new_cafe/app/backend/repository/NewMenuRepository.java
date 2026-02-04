package com.new_cafe.app.backend.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.entity.Menu;

@Repository
public class NewMenuRepository implements MenuRepository {

    private DataSource dataSource;
    public NewMenuRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public List<Menu> findAll() {
        return findAllByCategoryId(null);
    }

    @Override
    public List<Menu> findAllByCategoryId(Long categoryId) {
        // 1. 결과를 담을 빈 리스트 생성
        List<Menu> menus = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT * FROM menus");

        if (categoryId != null) {
            sql.append(" WHERE category_id = ?");
        }

        sql.append(" ORDER BY id ASC");

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {

            if (categoryId != null) {
                pstmt.setLong(1, categoryId);
            }

            try (ResultSet rs = pstmt.executeQuery()) {
                // 4. 결과 집합(ResultSet)을 순회하며 객체로 변환
                while (rs.next()) {
                    // 컬럼 데이터를 생성자에 바로 주입하여 리스트에 추가
                    Menu menu = Menu.builder()
                            .id(rs.getLong("id")) // PK
                            .korName(rs.getString("kor_name")) // 한글명
                            .engName(rs.getString("eng_name")) // 영문명
                            .price(rs.getInt("price")) // 가격
                            .categoryId(rs.getLong("category_id")) // 카테고리 FK
                            .description(rs.getString("description")) // 설명
                            .isAvailable(rs.getBoolean("is_available")) // 판매 가능 여부
                            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                            .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
                            .category(null)
                            .build();
                    menus.add(menu);
                } // 끝나면 자동 반납
            }
        } catch (Exception e) {
            // 기타 발생할 수 있는 모든 예외 처리
            e.printStackTrace();
        }

        // 6. 조회된 메뉴 리스트 반환 (오류 발생 시 빈 리스트 반환)
        return menus;
    }

    @Override
    public List<Menu> findAllByName(String name) {
        // 2.db 데이터
        List<Menu> menus = new ArrayList<>();
        String sql = "SELECT * FROM menus ORDER BY id ASC";

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                String keyword = rs.getString("kor_name");
                // 사용자가 입력한 searchKeyword가 포함되어 있는지 검사
                if (keyword != null && keyword.contains(name)) {
                    Menu menu = Menu.builder()
                            .id(rs.getLong("id"))
                            .korName(rs.getString("kor_name"))
                            .engName(rs.getString("eng_name"))
                            .price(rs.getInt("price"))
                            .categoryId(rs.getLong("category_id"))
                            .description(rs.getString("description"))
                            .isAvailable(rs.getBoolean("is_available"))
                            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                            .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
                            .category(null)
                            .build();
                    menus.add(menu);
                }
            }
        } catch (Exception e) {
            // 기타 발생할 수 있는 모든 예외 처리
            e.printStackTrace();
        }

        return menus;
    }

    @Override
    public List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery) {

        List<Menu> menus = new ArrayList<>();
        String sql = "SELECT * FROM menus WHERE 1=1";

        if (categoryId != null)
            sql += " AND category_id=" + categoryId;

        if (searchQuery != null && !searchQuery.isEmpty())
            sql += " AND kor_name LIKE '%" + searchQuery + "%'";

        sql += " ORDER BY id ASC";

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            try (ResultSet rs = pstmt.executeQuery()) {
                // 4. 결과 집합(ResultSet)을 순회하며 객체로 변환
                while (rs.next()) {
                    // 컬럼 데이터를 생성자에 바로 주입하여 리스트에 추가
                    Menu menu = Menu.builder()
                            .id(rs.getLong("id")) // PK
                            .korName(rs.getString("kor_name")) // 한글명
                            .engName(rs.getString("eng_name")) // 영문명
                            .price(rs.getInt("price")) // 가격
                            .categoryId(rs.getLong("category_id")) // 카테고리 FK
                            .description(rs.getString("description")) // 설명
                            .isAvailable(rs.getBoolean("is_available")) // 판매 가능 여부
                            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                            .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
                            .category(null)
                            .build();
                    menus.add(menu);
                } // 끝나면 자동 반납
            }
        } catch (Exception e) {
            // 기타 발생할 수 있는 모든 예외 처리
            e.printStackTrace();
        }
        return menus;
    }
}
