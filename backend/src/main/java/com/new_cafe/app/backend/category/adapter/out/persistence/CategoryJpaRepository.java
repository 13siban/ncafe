package com.new_cafe.app.backend.category.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.category.domain.model.Category;

import java.util.List;

@Repository
public interface CategoryJpaRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c.id, c.name, c.sortOrder, COUNT(m.id) " +
           "FROM Category c LEFT JOIN ServiceMenu m ON c.id = m.categoryId " +
           "GROUP BY c.id, c.name, c.sortOrder " +
           "ORDER BY c.sortOrder")
    List<Object[]> findAllCategoriesWithMenuCount();
}
