package com.mbolo.chat.repository;

import com.mbolo.chat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    Page<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);
    Message findFirstByConversationIdOrderByCreatedAtDesc(String conversationId);
    long countByConversationIdAndSenderIdNotAndSeenByNotContaining(String conversationId, String senderId, String userId);
    List<Message> findByConversationIdAndSenderIdNotAndSeenByNotContaining(String conversationId, String senderId, String userId);
}
