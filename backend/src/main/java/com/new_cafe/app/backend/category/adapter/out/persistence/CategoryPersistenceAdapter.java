package com.new_cafe.app.backend.category.adapter.out.persistence;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.category.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.category.domain.model.Category;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class CategoryPersistenceAdapter implements CategoryRepositoryPort {

    private final CategoryJpaRepository categoryJpaRepository;

    @Override
    public List<CategoryResponse> findAllWithMenuCount() {
        return categoryJpaRepository.findAllCategoriesWithMenuCount().stream()
                .map(row -> CategoryResponse.builder()
                        .id((Long) row[0])
                        .name((String) row[1])
                        .sortOrder((Integer) row[2])
                        .menuCount(((Long) row[3]).intValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public Category findById(Long id) {
        return categoryJpaRepository.findById(id).orElse(null);
    }
}
