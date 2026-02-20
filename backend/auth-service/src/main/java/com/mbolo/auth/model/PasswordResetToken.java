package com.mbolo.auth.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    private String id;
    
    @Indexed
    private String email;
    
    private String otp;
    
    @Indexed(expireAfterSeconds = 600) // Expire après 10 minutes
    private Instant expiresAt;
    
    private boolean used = false;
    
    private Instant createdAt = Instant.now();
}
