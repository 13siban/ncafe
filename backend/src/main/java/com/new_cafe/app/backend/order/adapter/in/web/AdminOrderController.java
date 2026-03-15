package com.new_cafe.app.backend.order.adapter.in.web;

import com.new_cafe.app.backend.order.application.port.in.GetOrderUseCase;
import com.new_cafe.app.backend.order.application.port.in.ManageOrderStatusUseCase;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.new_cafe.app.backend.order.application.service.OrderNotificationService;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final GetOrderUseCase getOrderUseCase;
    private final ManageOrderStatusUseCase manageOrderStatusUseCase;
    private final OrderNotificationService orderNotificationService;
    @GetMapping("/subscribe")
    public SseEmitter subscribe() {
        return orderNotificationService.subscribe();
    }

    @GetMapping
    public ResponseEntity<List<GetOrderUseCase.OrderListDto>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date) {
        LocalDate parsedDate = date != null ? LocalDate.parse(date) : null;
        return ResponseEntity.ok(getOrderUseCase.getAllOrders(status, parsedDate));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GetOrderUseCase.OrderDto> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(getOrderUseCase.getOrderById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        manageOrderStatusUseCase.changeOrderStatus(id, request.getStatus());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> rejectOrder(@PathVariable Long id, @RequestBody RejectRequest request) {
        manageOrderStatusUseCase.rejectOrder(id, request.getReason());
        return ResponseEntity.ok().build();
    }

    @Data
    static class StatusRequest {
        private String status;
    }

    @Data
    static class RejectRequest {
        private String reason;
    }
}
