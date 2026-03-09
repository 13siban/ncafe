package com.new_cafe.app.backend.payment;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentVerificationService {

    @Value("${portone.api-secret}")
    private String apiSecret;

    private final RestTemplate restTemplate;

    /**
     * 포트원 API를 호출하여 결제 정보를 검증합니다.
     * @param paymentId 포트원 결제 고유 ID
     * @param expectedAmount 프론트엔드에서 계산된 예상 결제 금액
     */
    public void verifyPayment(String paymentId, int expectedAmount) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "PortOne " + apiSecret);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            // 포트원 V2 API: 결제 단건 조회
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.portone.io/payments/" + paymentId,
                HttpMethod.GET,
                entity,
                Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new RuntimeException("결제 정보를 확인할 수 없습니다.");
            }

            String status = (String) body.get("status");
            Map<String, Object> amount = (Map<String, Object>) body.get("amount");
            
            if (amount == null || amount.get("total") == null) {
                throw new RuntimeException("결제 금액 정보를 확인할 수 없습니다.");
            }
            
            int paidAmount = ((Number) amount.get("total")).intValue();

            // 검증 1: 결제 상태 확인 (V2 API 기준 PAID)
            if (!"PAID".equals(status)) {
                throw new RuntimeException("결제가 완료되지 않았습니다. 상태: " + status);
            }

            // 검증 2: 금액 일치 확인 (위변조 방지)
            if (paidAmount != expectedAmount) {
                throw new RuntimeException(
                    String.format("결제 금액이 일치하지 않습니다. (기대: %d, 실제: %d)", expectedAmount, paidAmount)
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("결제 검증 중 오류 발생: " + e.getMessage());
        }
    }
}
