package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;

@Repository
public class MenuImagePersistenceAdapter implements MenuImageRepositoryPort {

    private final DataSource dataSource;

    public MenuImagePersistenceAdapter(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public List<MenuImage> findAllByMenuId(Long menuId) {
        List<MenuImage> menuImages = new ArrayList<>();
        String sql = "SELECT * FROM menu_images WHERE menu_id = ? ORDER BY sort_order";

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, menuId);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    MenuImage menuImage = MenuImage.builder()
                            .id(rs.getLong("id"))
                            .menuId(rs.getLong("menu_id"))
                            .srcUrl(rs.getString("src_url"))
                            .sortOrder(rs.getInt("sort_order"))
                            .build();
                    menuImages.add(menuImage);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return menuImages;
    }
}
