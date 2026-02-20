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
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type = "TEXT"; // TEXT, IMAGE, AUDIO, VIDEO, FILE
    private String mediaUrl; // Pour les images, vidéos, fichiers
    private List<String> seenBy = new ArrayList<>();
    private boolean deleted = false;
    private Instant createdAt = Instant.now();
    private Instant updatedAt;
    
    // Nouvelles fonctionnalités WhatsApp
    private List<String> reactions = new ArrayList<>(); // Format: "userId:emoji"
    private boolean starred = false;
    private String replyTo; // ID du message auquel on répond
    private boolean forwarded = false;
}
