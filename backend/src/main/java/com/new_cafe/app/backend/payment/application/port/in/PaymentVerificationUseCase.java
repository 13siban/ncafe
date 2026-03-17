package com.new_cafe.app.backend.payment.application.port.in;

public interface PaymentVerificationUseCase {
    void verifyPayment(String paymentId, int expectedAmount);
    void cancelPayment(String paymentId, String reason);
}
