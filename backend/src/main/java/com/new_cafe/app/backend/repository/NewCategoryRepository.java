package com.new_cafe.app.backend.repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.entity.Category;

@Repository
public class NewCategoryRepository implements CategoryRepository {
    
    private DataSource dataSource;
    public NewCategoryRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override

    public List<Category> findAll() {
        List<Category> categories = new ArrayList<>();
        String sql = "SELECT * FROM categories order by sort_order";

        try (Connection conn = dataSource.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {


                while (rs.next()) {
                    // Category category = new Category(
                    //     rs.getInt("id"),
                    //     rs.getString("name")
                    // );
                    // categories.add(category);
                    
                    Category category = Category.builder() //lombok builder 사용
                            .id(rs.getLong("id"))
                            .name(rs.getString("name"))
                            .icon(rs.getString("icon"))
                            .sortOrder(rs.getInt("sort_order"))
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
