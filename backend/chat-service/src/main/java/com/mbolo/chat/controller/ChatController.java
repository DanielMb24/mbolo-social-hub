package com.mbolo.chat.controller;

import com.mbolo.chat.model.Conversation;
import com.mbolo.chat.model.Message;
import com.mbolo.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/conversations")
    public ResponseEntity<Map<String, Object>> getConversations(@RequestHeader("X-User-Id") String userId) {
        List<Conversation> convos = chatService.getUserConversations(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", convos));
    }

    @PostMapping("/conversations")
    public ResponseEntity<Map<String, Object>> createConversation(@RequestBody Conversation conversation) {
        return ResponseEntity.ok(Map.of("success", true, "data", chatService.createConversation(conversation)));
    }

    @GetMapping("/conversations/private/{otherUserId}")
    public ResponseEntity<Map<String, Object>> getOrCreatePrivateConversation(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String otherUserId) {
        Conversation conv = chatService.getOrCreatePrivateConversation(userId, otherUserId);
        return ResponseEntity.ok(Map.of("success", true, "data", conv));
    }

    @GetMapping("/messages/{conversationId}")
    public ResponseEntity<Map<String, Object>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Message> messages = chatService.getMessages(conversationId, page, size);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "content", messages.getContent(),
                "totalElements", messages.getTotalElements(),
                "totalPages", messages.getTotalPages(),
                "currentPage", messages.getNumber(),
                "size", messages.getSize()
            )
        ));
    }

    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Message message) {
        message.setSenderId(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", chatService.sendMessage(message)));
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("conversationId") String conversationId,
            @RequestParam("type") String type) {
        try {
            String fileUrl = chatService.uploadFile(file, userId, conversationId, type);
            return ResponseEntity.ok(Map.of(
                "success", true, 
                "url", fileUrl,
                "message", "Fichier uploadé avec succès"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'upload: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/messages/{messageId}/seen")
    public ResponseEntity<Map<String, Object>> markMessageAsSeen(
            @PathVariable String messageId,
            @RequestHeader("X-User-Id") String userId) {
        chatService.markAsSeen(messageId, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Message marqué comme lu"));
    }

    @PutMapping("/conversations/{conversationId}/seen")
    public ResponseEntity<Map<String, Object>> markConversationAsSeen(
            @PathVariable String conversationId,
            @RequestHeader("X-User-Id") String userId) {
        chatService.markConversationAsSeen(conversationId, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Conversation marquée comme lue"));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Map<String, Object>> deleteMessage(
            @PathVariable String messageId,
            @RequestHeader("X-User-Id") String userId) {
        chatService.deleteMessage(messageId, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Message supprimé"));
    }

    @PostMapping("/conversations/{conversationId}/typing")
    public ResponseEntity<Map<String, Object>> sendTypingIndicator(
            @PathVariable String conversationId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            // Envoyer via WebSocket aux autres participants
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId,
                Map.of(
                    "type", "TYPING",
                    "userId", userId,
                    "timestamp", System.currentTimeMillis()
                )
            );
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Erreur envoi indicateur frappe", e);
            return ResponseEntity.ok(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/messages/{messageId}/react")
    public ResponseEntity<Map<String, Object>> reactToMessage(
            @PathVariable String messageId,
            @RequestBody Map<String, String> request,
            @RequestHeader("X-User-Id") String userId) {
        try {
            String emoji = request.get("emoji");
            chatService.toggleReaction(messageId, userId, emoji);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Erreur ajout réaction", e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/messages/{messageId}/star")
    public ResponseEntity<Map<String, Object>> starMessage(
            @PathVariable String messageId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            chatService.toggleStar(messageId, userId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Erreur message favori", e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
