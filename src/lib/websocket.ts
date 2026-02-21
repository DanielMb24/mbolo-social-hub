import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client | null = null;
  private connected = false;

  connect(onMessageReceived: (message: any) => void, conversationId?: string) {
    if (this.connected) {
      return;
    }

    // Utiliser l'API Gateway au lieu de se connecter directement au service
    // SockJS n'accepte que http:// ou https://, pas ws://
    let wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws-chat';
    
    // Convertir ws:// en http:// et wss:// en https://
    if (wsUrl.startsWith('ws://')) {
      wsUrl = wsUrl.replace('ws://', 'http://');
    } else if (wsUrl.startsWith('wss://')) {
      wsUrl = wsUrl.replace('wss://', 'https://');
    }
    
    const socket = new SockJS(wsUrl);
    
    this.client = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('WebSocket connected');
      this.connected = true;

      if (conversationId && this.client) {
        // S'abonner aux messages de la conversation
        this.client.subscribe(`/topic/conversation/${conversationId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          onMessageReceived(receivedMessage);
        });

        // S'abonner aux notifications de lecture
        this.client.subscribe(`/topic/conversation/${conversationId}/seen`, (message) => {
          const seenData = JSON.parse(message.body);
          onMessageReceived({ type: 'SEEN', data: seenData });
        });

        // S'abonner aux suppressions
        this.client.subscribe(`/topic/conversation/${conversationId}/deleted`, (message) => {
          const messageId = JSON.parse(message.body);
          onMessageReceived({ type: 'DELETED', messageId });
        });
      }
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  subscribeToConversation(conversationId: string, onMessageReceived: (message: any) => void) {
    if (this.client && this.connected) {
      this.client.subscribe(`/topic/conversation/${conversationId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        onMessageReceived(receivedMessage);
      });
    }
  }
}

export const wsService = new WebSocketService();
