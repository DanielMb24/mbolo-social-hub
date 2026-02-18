package com.mbolo.chat.repository;

import com.mbolo.chat.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByParticipantsContaining(String userId);
}
