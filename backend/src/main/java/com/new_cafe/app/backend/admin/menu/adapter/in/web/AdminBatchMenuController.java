package com.new_cafe.app.backend.admin.menu.adapter.in.web;

import com.new_cafe.app.backend.admin.menu.application.service.BatchAdminMenuService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/menus")
@RequiredArgsConstructor
public class AdminBatchMenuController {

    private final BatchAdminMenuService batchService;

    @PutMapping("/batch")
    public ResponseEntity<Void> batchUpdate(@RequestBody List<BatchUpdateDto> requests) {
        batchService.batchUpdate(requests);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorder(@RequestBody List<ReorderDto> requests) {
        batchService.reorder(requests);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/sold-out")
    public ResponseEntity<Void> toggleSoldOut(@PathVariable Long id, @RequestBody SoldOutDto dto) {
        batchService.toggleSoldOut(id, dto.getIsSoldOut());
        return ResponseEntity.ok().build();
    }
}
