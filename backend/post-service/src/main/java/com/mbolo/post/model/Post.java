package com.mbolo.post.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    private String authorId;
    private String content;
    private String imageUrl;
    private List<String> likes = new ArrayList<>();
    private int commentsCount = 0;
    private boolean deleted = false;
    private Instant createdAt = Instant.now();
}
