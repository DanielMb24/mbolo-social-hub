package com.mbolo.user.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "user_follows")
@CompoundIndex(name = "follower_following_idx", def = "{'followerId': 1, 'followingId': 1}", unique = true)
public class UserFollow {
    @Id
    private String id;
    
    private String followerId;    // Celui qui suit
    private String followingId;   // Celui qui est suivi
    private Instant createdAt = Instant.now();
}
