package com.mbolo.moderation.controller;

import com.mbolo.moderation.model.BannedUser;
import com.mbolo.moderation.model.Report;
import com.mbolo.moderation.service.ModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;

    @PostMapping("/reports")
    public ResponseEntity<Map<String, Object>> createReport(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Report report) {
        report.setReporterId(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", moderationService.createReport(report)));
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getPendingReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Report> reports = moderationService.getPendingReports(page, size);
        return ResponseEntity.ok(Map.of("success", true, "data", reports));
    }

    @PutMapping("/reports/{id}")
    public ResponseEntity<Map<String, Object>> resolveReport(
            @PathVariable String id,
            @RequestParam String status) {
        return ResponseEntity.ok(Map.of("success", true, "data", moderationService.resolveReport(id, status)));
    }

    @PostMapping("/ban")
    public ResponseEntity<Map<String, Object>> banUser(
            @RequestHeader("X-User-Id") String actorId,
            @RequestParam String userId,
            @RequestParam String reason,
            @RequestParam long durationDays) {
        BannedUser banned = moderationService.banUser(userId, reason,
            Instant.now().plusSeconds(durationDays * 86400), actorId);
        return ResponseEntity.ok(Map.of("success", true, "data", banned));
    }

    @GetMapping("/banned/{userId}")
    public ResponseEntity<Map<String, Object>> checkBan(@PathVariable String userId) {
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of("banned", moderationService.isUserBanned(userId))));
    }
}
