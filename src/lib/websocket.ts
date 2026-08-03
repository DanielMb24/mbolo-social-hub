import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client | null = null;
  private connected = false;

  connect(onMessageReceived: (message: any) => void, conversationId?: string) {
    if (this.connected) {
      return;
    }

    const wsUrl = resolveSockJsUrl();
    if (!wsUrl) return;

    let socket: SockJS;
    try {
      socket = new SockJS(wsUrl, undefined, {
        transports: ["websocket"],
      });
    } catch (error) {
      console.warn("Connexion temps réel indisponible:", error);
      return;
    }
    
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

    this.client.onWebSocketError = (event) => {
      console.warn("WebSocket indisponible", event);
    };

    try {
      this.client.activate();
    } catch (error) {
      console.warn("Connexion temps réel indisponible:", error);
      this.connected = false;
    }
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

function resolveSockJsUrl() {
  const configured = String(import.meta.env.VITE_WS_URL || "").trim();
  if (!configured && import.meta.env.PROD) {
    console.info("Chat temps réel désactivé: VITE_WS_URL n'est pas configuré.");
    return "";
  }
  let raw = configured || "http://localhost:8080/ws-chat";

  if (raw.startsWith("ws://")) raw = raw.replace("ws://", "http://");
  if (raw.startsWith("wss://")) raw = raw.replace("wss://", "https://");

  try {
    const url = new URL(raw, window.location.origin);
    if (window.location.protocol === "https:" && url.protocol === "http:") {
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        console.warn("WebSocket désactivé: URL locale non sécurisée en HTTPS");
        return "";
      }
      url.protocol = "https:";
    }
    if (!url.pathname || url.pathname === "/") url.pathname = "/ws-chat";
    return url.toString();
  } catch {
    console.warn("VITE_WS_URL invalide");
    return "";
  }
}
