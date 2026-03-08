package com.new_cafe.app.backend.store.domain.model;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class StoreSettings {
    private Integer id;
    private Boolean isOpen;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String openTime;
    private String closeTime;
    private LocalDateTime updatedAt;
}
