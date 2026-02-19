package com.new_cafe.app.backend.menu.adapter.in.web.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuListResponse {
    private List<MenuResponse> menus;
    private int total;
}
