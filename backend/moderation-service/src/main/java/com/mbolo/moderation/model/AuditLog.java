package com.mbolo.moderation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;
    private String action;
    private String actorId;
    private String targetType;
    private String targetId;
    private String details;
    private Instant timestamp = Instant.now();
}
