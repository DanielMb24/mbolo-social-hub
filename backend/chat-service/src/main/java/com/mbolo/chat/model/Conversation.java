package com.mbolo.chat.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "conversations")
public class Conversation {
    @Id
    private String id;
    private List<String> participants = new ArrayList<>();
    private String type; // PRIVATE, GROUP
    private String groupName;
    private Instant createdAt = Instant.now();
}
