package com.new_cafe.app.backend.admin.menu.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadMenuImageCommand {
    private Long menuId;
    private List<MultipartFile> files;
}
