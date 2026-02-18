package com.mbolo.chat.controller;

import com.mbolo.chat.model.Message;
import com.mbolo.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatService chatService;

    @MessageMapping("/chat/{conversationId}")
    @SendTo("/topic/conversation/{conversationId}")
    public Message sendMessage(@DestinationVariable String conversationId, Message message) {
        message.setConversationId(conversationId);
        return chatService.sendMessage(message);
    }
}
