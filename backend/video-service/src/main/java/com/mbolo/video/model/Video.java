package com.mbolo.video.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "videos")
public class Video {
    @Id
    private String id;
    private String authorId;
    private String videoUrl;
    private String thumbnailUrl;
    private String title;
    private int views = 0;
    private List<String> likes = new ArrayList<>();
    private Instant createdAt = Instant.now();
}
