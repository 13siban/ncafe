package com.new_cafe.app.backend.menu.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메뉴 상세 조회 커맨드
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetMenuDetailCommand {
    private Long id;
    private String engName;
}
