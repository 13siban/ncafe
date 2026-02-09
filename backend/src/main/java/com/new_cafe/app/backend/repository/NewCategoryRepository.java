package com.new_cafe.app.backend.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.dto.CategoryResponse;
import com.new_cafe.app.backend.entity.Category;

@Repository
public class NewCategoryRepository implements CategoryRepository {
    
    private DataSource dataSource;
    public NewCategoryRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override

    public List<CategoryResponse> findAllWithMenuCount() {
        List<CategoryResponse> categories = new ArrayList<>();
        String sql = """
            SELECT c.id, c.name, c.icon, c.sort_order, COUNT(m.id) as menu_count 
            FROM categories c 
            LEFT JOIN menus m ON c.id = m.category_id 
            GROUP BY c.id 
            ORDER BY c.sort_order
        """;

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {


                while (rs.next()) {
                    // Category category = new Category(
                    //     rs.getInt("id"),
                    //     rs.getString("name")
                    // );
                    // categories.add(category);
                    
                    CategoryResponse category = CategoryResponse.builder() //lombok builder 사용
                            .id(rs.getLong("id"))
                            .name(rs.getString("name"))
                            .icon(rs.getString("icon"))
                            .sortOrder(rs.getInt("sort_order"))
                            .menuCount(rs.getInt("menu_count"))
                            .build();
                    categories.add(category);
                }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return categories;
    }

    @Override
    public Category findById(Long id) {
        String sql = "SELECT * FROM categories WHERE id = ?";
        Category category = null;

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setLong(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    category = Category.builder()
                            .id(rs.getLong("id"))
                            .name(rs.getString("name"))
                            .icon(rs.getString("icon"))
                            .sortOrder(rs.getInt("sort_order"))
                            .build();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return category;
    }
}
