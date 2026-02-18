package com.mbolo.chat.controller;

import com.mbolo.chat.model.Conversation;
import com.mbolo.chat.model.Message;
import com.mbolo.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    public ResponseEntity<Map<String, Object>> getConversations(@RequestHeader("X-User-Id") String userId) {
        List<Conversation> convos = chatService.getUserConversations(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", convos));
    }

    @PostMapping("/conversations")
    public ResponseEntity<Map<String, Object>> createConversation(@RequestBody Conversation conversation) {
        return ResponseEntity.ok(Map.of("success", true, "data", chatService.createConversation(conversation)));
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
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody Message message) {
        return ResponseEntity.ok(Map.of("success", true, "data", chatService.sendMessage(message)));
    }
}
