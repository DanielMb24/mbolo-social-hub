import { api } from './api';

export interface Conversation {
  id: string;
  participants: string[];
  type: 'PRIVATE' | 'GROUP';
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'FILE';
  mediaUrl?: string;
  seenBy: string[];
  deleted: boolean;
  createdAt: string;
  updatedAt?: string;
  reactions?: MessageReaction[];
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  starred?: boolean;
  forwarded?: boolean;
}

export interface MessagesResponse {
  content: Message[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export const chatApi = {
  // Récupérer toutes les conversations de l'utilisateur
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/api/chat/conversations');
    return response;
  },

  // Créer ou récupérer une conversation privée
  getOrCreatePrivateConversation: async (otherUserId: string): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/api/chat/conversations/private/${otherUserId}`);
    return response;
  },

  // Créer une conversation de groupe
  createGroupConversation: async (participants: string[], groupName: string): Promise<Conversation> => {
    const response = await api.post<Conversation>('/api/chat/conversations', {
      participants,
      type: 'GROUP',
      groupName,
    });
    return response;
  },

  // Récupérer les messages d'une conversation
  getMessages: async (conversationId: string, page = 0, size = 20): Promise<MessagesResponse> => {
    const response = await api.get<MessagesResponse>(`/api/chat/messages/${conversationId}?page=${page}&size=${size}`);
    return response;
  },

  // Envoyer un message
  sendMessage: async (conversationId: string, content: string, type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE' = 'TEXT'): Promise<Message> => {
    const response = await api.post<Message>('/api/chat/messages', {
      conversationId,
      content,
      type,
    });
    return response;
  },

  // Marquer un message comme lu
  markMessageAsSeen: async (messageId: string): Promise<void> => {
    await api.put(`/api/chat/messages/${messageId}/seen`);
  },

  // Marquer toute une conversation comme lue
  markConversationAsSeen: async (conversationId: string): Promise<void> => {
    await api.put(`/api/chat/conversations/${conversationId}/seen`);
  },

  // Supprimer un message
  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`/api/chat/messages/${messageId}`);
  },

  // Réagir à un message
  reactToMessage: async (messageId: string, emoji: string): Promise<void> => {
    await api.post(`/api/chat/messages/${messageId}/react`, { emoji });
  },

  // Marquer un message comme favori
  starMessage: async (messageId: string): Promise<void> => {
    await api.put(`/api/chat/messages/${messageId}/star`);
  },

  // Envoyer un indicateur de frappe
  sendTypingIndicator: async (conversationId: string): Promise<void> => {
    await api.post(`/api/chat/conversations/${conversationId}/typing`);
  },
};
