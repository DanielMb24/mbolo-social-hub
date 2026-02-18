package com.mbolo.moderation.service;

import com.mbolo.moderation.model.AuditLog;
import com.mbolo.moderation.model.BannedUser;
import com.mbolo.moderation.model.Report;
import com.mbolo.moderation.repository.AuditLogRepository;
import com.mbolo.moderation.repository.BannedUserRepository;
import com.mbolo.moderation.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ReportRepository reportRepository;
    private final BannedUserRepository bannedUserRepository;
    private final AuditLogRepository auditLogRepository;

    public Report createReport(Report report) {
        return reportRepository.save(report);
    }

    public Page<Report> getPendingReports(int page, int size) {
        return reportRepository.findByStatusOrderByCreatedAtDesc("PENDING", PageRequest.of(page, size));
    }

    public Report resolveReport(String reportId, String status) {
        Report report = reportRepository.findById(reportId).orElseThrow();
        report.setStatus(status);
        return reportRepository.save(report);
    }

    public BannedUser banUser(String userId, String reason, Instant until, String actorId) {
        BannedUser banned = new BannedUser();
        banned.setUserId(userId);
        banned.setReason(reason);
        banned.setBannedUntil(until);
        bannedUserRepository.save(banned);

        AuditLog log = new AuditLog();
        log.setAction("BAN_USER");
        log.setActorId(actorId);
        log.setTargetType("USER");
        log.setTargetId(userId);
        log.setDetails("Raison: " + reason);
        auditLogRepository.save(log);

        return banned;
    }

    public boolean isUserBanned(String userId) {
        return bannedUserRepository.findByUserId(userId)
            .map(b -> b.getBannedUntil().isAfter(Instant.now()))
            .orElse(false);
    }
}
