package com.new_cafe.app.backend.admin.category.application.port.in;

import com.new_cafe.app.backend.admin.category.application.command.UpdateCategoryCommand;

public interface UpdateCategoryUseCase {
    void updateCategory(UpdateCategoryCommand command);
}
