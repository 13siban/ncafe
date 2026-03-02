package com.new_cafe.app.backend.admin.menu.domain.model;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuImage {
    private Long id;
    private Long menuId;
    private String srcUrl;
    @Setter private Integer sortOrder;
    private LocalDateTime createdAt;
    
    public void markAsPrimary() {
        this.sortOrder = 1;
    }
}
