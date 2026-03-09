package com.new_cafe.app.backend.order.adapter.in.web;

import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.order.application.port.in.CreateOrderUseCase;
import com.new_cafe.app.backend.order.application.port.in.GetOrderUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final GetOrderUseCase getOrderUseCase;

    @PostMapping
    public ResponseEntity<CreateOrderUseCase.OrderResponse> createOrder(@RequestBody CreateOrderUseCase.CreateOrderCommand command, @AuthenticationPrincipal User user) {
        String userId = user != null ? user.getId() : null;
        if (userId == null && command.getCustomerName() == null) {
            command = CreateOrderUseCase.CreateOrderCommand.builder()
                    .customerName("비회원")
                    .memo(command.getMemo())
                    .items(command.getItems())
                    .paymentId(command.getPaymentId())
                    .paymentMethod(command.getPaymentMethod())
                    .build();
        } else if (userId != null && (command.getCustomerName() == null || command.getCustomerName().isBlank())) {
            command = CreateOrderUseCase.CreateOrderCommand.builder()
                    .customerName(user.getUsername())
                    .memo(command.getMemo())
                    .items(command.getItems())
                    .paymentId(command.getPaymentId())
                    .paymentMethod(command.getPaymentMethod())
                    .build();
        }
        
        return ResponseEntity.ok(createOrderUseCase.createOrder(command, userId));
    }

    @GetMapping("/{date}/{number}")
    public ResponseEntity<GetOrderUseCase.OrderDto> getOrder(@PathVariable String date, @PathVariable Integer number) {
        return ResponseEntity.ok(getOrderUseCase.getOrder(LocalDate.parse(date), number));
    }

    @GetMapping("/my")
    public ResponseEntity<List<GetOrderUseCase.OrderListDto>> getMyOrders(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(getOrderUseCase.getMyOrders(user.getId()));
    }
}
