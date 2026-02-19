package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;

@Repository
public class MenuPersistenceAdapter implements MenuRepositoryPort {

    private final DataSource dataSource;

    public MenuPersistenceAdapter(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public List<Menu> findAll() {
        return findAllByCategoryId(null);
    }

    @Override
    public List<Menu> findAllByCategoryId(Long categoryId) {
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
                while (rs.next()) {
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
            e.printStackTrace();
        }

        return menus;
    }

    @Override
    public List<Menu> findAllByName(String name) {
        List<Menu> menus = new ArrayList<>();
        String sql = "SELECT * FROM menus ORDER BY id ASC";

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                String keyword = rs.getString("kor_name");
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
                while (rs.next()) {
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
            e.printStackTrace();
        }
        return menus;
    }

    @Override
    public Menu findById(Long id) {
        String sql = "SELECT * FROM menus WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, id);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Menu.builder()
                            .id(rs.getLong("id"))
                            .korName(rs.getString("kor_name"))
                            .engName(rs.getString("eng_name"))
                            .price(rs.getInt("price"))
                            .categoryId(rs.getLong("category_id"))
                            .description(rs.getString("description"))
                            .isAvailable(rs.getBoolean("is_available"))
                            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                            .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
                            .build();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
