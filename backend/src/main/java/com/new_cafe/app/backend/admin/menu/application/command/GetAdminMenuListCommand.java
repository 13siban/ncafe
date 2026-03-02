package com.new_cafe.app.backend.admin.menu.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetAdminMenuListCommand {
    private Long categoryId;
    private String searchQuery;
}
