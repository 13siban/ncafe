package com.new_cafe.app.backend.notice.adapter.in.web;

import com.new_cafe.app.backend.notice.application.port.in.GetNoticePopupUseCase;
import com.new_cafe.app.backend.notice.domain.NoticePopup;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/notice-popups")
@RequiredArgsConstructor
public class NoticePopupController {
    
    private final GetNoticePopupUseCase useCase;
    
    @GetMapping("/active")
    public ResponseEntity<List<NoticePopup>> getActive() {
        return ResponseEntity.ok(useCase.getActivePopups());
    }
}
