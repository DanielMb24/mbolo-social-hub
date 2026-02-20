package com.mbolo.auth.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "users_auth")
public class UserAuth {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;
    
    private String phone;
    private String password;
    private String fullName;
    private String profilePicture;
    
    // Google OAuth
    private String googleId;
    private boolean emailVerified = false;
    
    private List<String> roles = List.of("ROLE_USER");
    private boolean isActive = true;
    private boolean isVerified = false;
    private Instant createdAt = Instant.now();
    private Instant lastLogin;
}
