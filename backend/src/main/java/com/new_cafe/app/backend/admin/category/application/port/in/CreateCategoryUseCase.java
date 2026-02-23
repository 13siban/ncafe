package com.new_cafe.app.backend.admin.category.application.port.in;

import com.new_cafe.app.backend.admin.category.application.command.CreateCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.result.CreateCategoryResult;

public interface CreateCategoryUseCase {
    CreateCategoryResult createCategory(CreateCategoryCommand command);
}
