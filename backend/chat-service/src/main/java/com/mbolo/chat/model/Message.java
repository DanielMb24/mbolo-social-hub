package com.mbolo.chat.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "messages")
public class Message {
    @Id
    private String id;

    @Indexed
    private String conversationId;

    private String senderId;
    private String content;
    private String type = "TEXT"; // TEXT, IMAGE, AUDIO
    private List<String> seenBy = new ArrayList<>();
    private Instant createdAt = Instant.now();
}
