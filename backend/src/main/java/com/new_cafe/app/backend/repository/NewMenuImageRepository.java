package com.new_cafe.app.backend.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.entity.MenuImage;

@Repository
public class NewMenuImageRepository implements MenuImageRepository {
    
    private DataSource dataSource;

    public NewMenuImageRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public List<MenuImage> findAllByMenuId(Long menuId) {
        List<MenuImage> menuImages = new ArrayList<>();
        String sql = "SELECT * FROM menu_images WHERE menu_id = ? ORDER BY sort_order";

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setLong(1, menuId); // 1번 ?에 menuId를 바인딩

            try (ResultSet rs = pstmt.executeQuery()) {
                // 4. 결과 집합(ResultSet)을 순회하며 객체로 변환
                while (rs.next()) {
                    // 컬럼 데이터를 생성자에 바로 주입하여 리스트에 추가
                    MenuImage menuImage = MenuImage.builder()
                            .id(rs.getLong("id")) // PK
                            .menuId(rs.getLong("menu_id")) // 메뉴 FK
                            .srcUrl(rs.getString("src_url")) // 이미지 URL
                            .sortOrder(rs.getInt("sort_order")) // 정렬 순서
                            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                            .build();
                    menuImages.add(menuImage);
                } // 끝나면 자동 반납
            }
        } catch (Exception e) {
            // 기타 발생할 수 있는 모든 예외 처리
            e.printStackTrace();
        }

        // 6. 조회된 메뉴 리스트 반환 (오류 발생 시 빈 리스트 반환)
        return menuImages;
    }
}
