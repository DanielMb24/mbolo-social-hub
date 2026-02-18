package com.mbolo.user.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "users_profile")
public class UserProfile {
    @Id
    private String id;

    @TextIndexed
    private String fullname;

    private String avatarUrl;
    private String bio;
    private String location;
    private List<String> blockedUsers = new ArrayList<>();
    private int followersCount = 0;
    private int followingCount = 0;
    private Instant createdAt = Instant.now();
}
