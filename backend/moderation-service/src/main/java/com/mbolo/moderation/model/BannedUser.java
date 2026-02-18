package com.mbolo.moderation.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "banned_users")
public class BannedUser {
    @Id
    private String id;
    private String userId;
    private String reason;
    private Instant bannedUntil;
    private Instant createdAt = Instant.now();
}
