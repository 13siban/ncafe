package com.new_cafe.app.backend.menu.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메뉴 목록 조회 커맨드 (페이징 및 필터링 강화)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetMenuListCommand {
    private Long categoryId;
    private String searchQuery;
    
    // 페이징 추가
    private Integer page;
    private Integer size;
    
    // 정렬 추가
    private String sortBy; // "price_asc", "price_desc", "newest", "sort_order"
    
    // 필터 추가
    private Boolean onlyAvailable; // 주문 가능한 것만 보기
}
