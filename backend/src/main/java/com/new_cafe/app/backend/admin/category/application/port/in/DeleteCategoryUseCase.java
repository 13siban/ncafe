package com.new_cafe.app.backend.admin.category.application.port.in;

import com.new_cafe.app.backend.admin.category.application.command.DeleteCategoryCommand;

public interface DeleteCategoryUseCase {
    void deleteCategory(DeleteCategoryCommand command);
}
