package com.mbolo.moderation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "reports")
public class Report {
    @Id
    private String id;
    private String reporterId;
    private String targetType; // POST, VIDEO, MESSAGE, USER
    private String targetId;
    private String reason;
    private String status = "PENDING"; // PENDING, RESOLVED, DISMISSED
    private Instant createdAt = Instant.now();
}
