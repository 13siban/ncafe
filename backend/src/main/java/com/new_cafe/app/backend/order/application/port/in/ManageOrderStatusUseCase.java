package com.new_cafe.app.backend.order.application.port.in;

public interface ManageOrderStatusUseCase {
    void changeOrderStatus(Long id, String status);
    void rejectOrder(Long id, String reason);
}
