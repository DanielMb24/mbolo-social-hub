package com.mbolo.chat.service;

import com.mbolo.chat.model.Conversation;
import com.mbolo.chat.model.Message;
import com.mbolo.chat.repository.ConversationRepository;
import com.mbolo.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByParticipantsContaining(userId);
    }

    public Conversation createConversation(Conversation conversation) {
        return conversationRepository.save(conversation);
    }

    public Message sendMessage(Message message) {
        return messageRepository.save(message);
    }

    public Page<Message> getMessages(String conversationId, int page, int size) {
        return messageRepository.findByConversationIdOrderByCreatedAtDesc(
            conversationId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public void markAsSeen(String messageId, String userId) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            if (!msg.getSeenBy().contains(userId)) {
                msg.getSeenBy().add(userId);
                messageRepository.save(msg);
            }
        });
    }
}
