package com.mbolo.chat.service;

import com.mbolo.chat.model.Conversation;
import com.mbolo.chat.model.Message;
import com.mbolo.chat.repository.ConversationRepository;
import com.mbolo.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${file.upload.dir:/tmp/uploads/chat}")
    private String uploadDir;

    public List<Conversation> getUserConversations(String userId) {
        List<Conversation> conversations = conversationRepository.findByParticipantsContaining(userId);
        
        // Enrichir chaque conversation avec le dernier message et le nombre de non-lus
        conversations.forEach(conv -> {
            Message lastMessage = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conv.getId());
            if (lastMessage != null) {
                conv.setLastMessage(lastMessage.getContent());
                conv.setLastMessageTime(lastMessage.getCreatedAt());
            }
            
            long unreadCount = messageRepository.countByConversationIdAndSenderIdNotAndSeenByNotContaining(
                conv.getId(), userId, userId
            );
            conv.setUnreadCount((int) unreadCount);
        });
        
        return conversations;
    }

    public Conversation createConversation(Conversation conversation) {
        conversation.setCreatedAt(Instant.now());
        return conversationRepository.save(conversation);
    }

    public Conversation getOrCreatePrivateConversation(String userId1, String userId2) {
        // Chercher une conversation existante entre ces deux utilisateurs
        List<Conversation> conversations = conversationRepository.findByParticipantsContaining(userId1);
        
        for (Conversation conv : conversations) {
            if (conv.getType().equals("PRIVATE") && 
                conv.getParticipants().contains(userId2) && 
                conv.getParticipants().size() == 2) {
                return conv;
            }
        }
        
        // Créer une nouvelle conversation
        Conversation newConv = new Conversation();
        newConv.setType("PRIVATE");
        newConv.getParticipants().add(userId1);
        newConv.getParticipants().add(userId2);
        newConv.setCreatedAt(Instant.now());
        
        return conversationRepository.save(newConv);
    }

    public String uploadFile(MultipartFile file, String userId, String conversationId, String type) throws IOException {
        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Générer un nom de fichier unique
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") 
            ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
            : "";
        String filename = UUID.randomUUID().toString() + extension;
        
        // Sauvegarder le fichier
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Retourner l'URL du fichier
        return "/uploads/chat/" + filename;
    }

    public Message sendMessage(Message message) {
        message.setCreatedAt(Instant.now());
        message.getSeenBy().add(message.getSenderId()); // Le sender a vu son propre message
        Message savedMessage = messageRepository.save(message);
        
        // Mettre à jour la conversation
        conversationRepository.findById(message.getConversationId()).ifPresent(conv -> {
            conv.setLastMessage(message.getContent());
            conv.setLastMessageTime(message.getCreatedAt());
            conversationRepository.save(conv);
        });
        
        // Envoyer via WebSocket à tous les participants
        messagingTemplate.convertAndSend("/topic/conversation/" + message.getConversationId(), savedMessage);
        
        return savedMessage;
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
                
                // Notifier via WebSocket
                messagingTemplate.convertAndSend(
                    "/topic/conversation/" + msg.getConversationId() + "/seen",
                    msg
                );
            }
        });
    }

    public void markConversationAsSeen(String conversationId, String userId) {
        List<Message> unreadMessages = messageRepository.findByConversationIdAndSenderIdNotAndSeenByNotContaining(
            conversationId, userId, userId
        );
        
        unreadMessages.forEach(msg -> {
            msg.getSeenBy().add(userId);
            messageRepository.save(msg);
        });
        
        if (!unreadMessages.isEmpty()) {
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId + "/seen",
                unreadMessages
            );
        }
    }

    public void deleteMessage(String messageId, String userId) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            if (msg.getSenderId().equals(userId)) {
                messageRepository.delete(msg);
                
                // Notifier via WebSocket
                messagingTemplate.convertAndSend(
                    "/topic/conversation/" + msg.getConversationId() + "/deleted",
                    messageId
                );
            }
        });
    }

    public void toggleReaction(String messageId, String userId, String emoji) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            // Vérifier si l'utilisateur a déjà réagi avec cet emoji
            String reactionKey = userId + ":" + emoji;
            
            if (msg.getReactions().contains(reactionKey)) {
                // Retirer la réaction
                msg.getReactions().remove(reactionKey);
            } else {
                // Ajouter la réaction
                msg.getReactions().add(reactionKey);
            }
            
            messageRepository.save(msg);
            
            // Notifier via WebSocket
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + msg.getConversationId() + "/reaction",
                msg
            );
        });
    }

    public void toggleStar(String messageId, String userId) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            msg.setStarred(!msg.isStarred());
            messageRepository.save(msg);
            
            // Notifier via WebSocket
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + msg.getConversationId() + "/star",
                msg
            );
        });
    }
}
