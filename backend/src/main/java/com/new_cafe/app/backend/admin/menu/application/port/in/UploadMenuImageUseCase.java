package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.UploadMenuImageCommand;

public interface UploadMenuImageUseCase {
    void uploadMenuImages(UploadMenuImageCommand command);
}
