import { Send, Phone, VideoIcon, MoreVertical, Search, Plus, Image, Mic, Smile, ArrowLeft, Check, CheckCheck, Loader2, Paperclip, User, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { chatApi, type Conversation, type Message } from "@/lib/chat-api";
import { wsService } from "@/lib/websocket";
import { toast } from "sonner";
import { NewConversationDialog } from "./NewConversationDialog";
import { AudioCallDialog } from "./AudioCallDialog";
import { VideoCallDialog } from "./VideoCallDialog";
import { AudioRecorder } from "./AudioRecorder";
import { ImageViewer } from "./ImageViewer";
import { AudioPlayer } from "./AudioPlayer";
import { ChatProfileSidebar } from "./ChatProfileSidebar";
import { MessageReactions } from "./MessageReactions";
import { TypingIndicator } from "./TypingIndicator";
import { MessageContextMenu } from "./MessageContextMenu";
import { ReplyPreview } from "./ReplyPreview";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import { OnlineStatus } from "./OnlineStatus";
import { MediaFallback } from "./MediaFallback";
import { userApi, type UserProfile } from "@/lib/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const ChatPage = () => {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<{ id: string; content: string } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Charger les profils utilisateurs (optimisé avec cache)
  const fetchUserProfile = async (userId: string) => {
    if (userProfiles[userId]) return userProfiles[userId];
    
    try {
      const profile = await userApi.getProfile(userId);
      setUserProfiles(prev => ({ ...prev, [userId]: profile }));
      return profile;
    } catch (error) {
      console.error(`Erreur chargement profil ${userId}:`, error);
      return null;
    }
  };

  // Charger les conversations (optimisé)
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await chatApi.getConversations();
        console.log('Conversations reçues:', data);
        
        // Gérer différents formats de réponse
        let convos: Conversation[] = [];
        if (Array.isArray(data)) {
          convos = data;
        } else if (data && typeof data === 'object') {
          const dataObj = data as { data?: unknown; content?: unknown };
          if (Array.isArray(dataObj.data)) {
            convos = dataObj.data as Conversation[];
          } else if (Array.isArray(dataObj.content)) {
            convos = dataObj.content as Conversation[];
          }
        }
        
        console.log('Conversations traitées:', convos);
        setConversations(convos);
        
        // Charger les profils en arrière-plan (ne pas bloquer l'affichage)
        if (convos.length > 0) {
          const userIds = new Set<string>();
          convos.forEach(convo => {
            convo.participants.forEach(userId => userIds.add(userId));
          });
          
          // Charger les profils sans attendre
          Array.from(userIds).forEach(userId => fetchUserProfile(userId));
        }
      } catch (error: unknown) {
        console.error("Erreur chargement conversations:", error);
        toast.error("Impossible de charger les conversations");
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Charger les messages et connecter WebSocket (optimisé)
  useEffect(() => {
    if (!selectedConvo) return;

    const loadMessages = async () => {
      try {
        const data = await chatApi.getMessages(selectedConvo, 0, 50);
        console.log('Messages reçus:', data);
        
        // Gérer différents formats de réponse
        let msgs: Message[] = [];
        
        // Format: {success: true, data: {content: [...], ...}}
        if (data && typeof data === 'object') {
          const dataObj = data as { 
            data?: unknown; 
            content?: unknown;
          };
          
          if (dataObj.data && typeof dataObj.data === 'object') {
            const nestedData = dataObj.data as { content?: unknown };
            if (Array.isArray(nestedData.content)) {
              msgs = nestedData.content as Message[];
            }
          } else if (Array.isArray(dataObj.content)) {
            msgs = dataObj.content as Message[];
          } else if (Array.isArray(dataObj.data)) {
            msgs = dataObj.data as Message[];
          } else if (Array.isArray(data)) {
            msgs = data as Message[];
          }
        }
        
        console.log('Messages traités:', msgs);
        
        // Inverser l'ordre pour afficher du plus ancien au plus récent
        setMessages(msgs.reverse());
        
        // Marquer comme vu en arrière-plan
        chatApi.markConversationAsSeen(selectedConvo).catch(err => 
          console.error("Erreur marquage vu:", err)
        );
      } catch (error: unknown) {
        console.error("Erreur chargement messages:", error);
        toast.error("Impossible de charger les messages");
        setMessages([]);
      }
    };

    loadMessages();

    // Connecter WebSocket
    wsService.connect((data: { type?: string; data?: unknown; userId?: string }) => {
      if (data.type === 'SEEN') {
        setMessages(prev => prev.map(msg => {
          if (data.data && Array.isArray(data.data) && data.data.includes(msg.id)) {
            return { ...msg, seenBy: [...msg.seenBy, data.userId || ''] };
          }
          return msg;
        }));
      } else if (data.type === 'DELETED') {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      } else if (data.type === 'TYPING') {
        // Gérer l'indicateur de frappe
        const { userId, userName } = data;
        setTypingUsers(prev => ({ ...prev, [userId]: userName }));
        setTimeout(() => {
          setTypingUsers(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
          });
        }, 3000);
      } else {
        setMessages(prev => [...prev, data]);
        const userId = localStorage.getItem('userId');
        if (data.senderId !== userId) {
          chatApi.markMessageAsSeen(data.id).catch(err => 
            console.error("Erreur marquage message vu:", err)
          );
        }
      }
    }, selectedConvo);

    return () => {
      wsService.disconnect();
    };
  }, [selectedConvo]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedConvo) return;

    const messageContent = message.trim();
    setMessage('');
    setSending(true);

    try {
      await chatApi.sendMessage(selectedConvo, messageContent);
    } catch (error: unknown) {
      console.error("Erreur envoi message:", error);
      toast.error("Erreur lors de l'envoi du message");
      setMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'IMAGE' | 'FILE') => {
    if (!selectedConvo) return;
    
    try {
      setSending(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', selectedConvo);
      formData.append('type', type);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }
      
      const result = await response.json();
      await chatApi.sendMessage(selectedConvo, result.url || file.name, type);
      
      toast.success(type === 'IMAGE' ? 'Image envoyée' : 'Fichier envoyé');
    } catch (error) {
      console.error("Erreur upload fichier:", error);
      toast.error("Erreur lors de l'envoi du fichier");
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFileUpload(file, 'IMAGE');
      } else {
        toast.error("Veuillez sélectionner une image");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'FILE');
    }
  };

  const handleEmojiSelect = (emoji: { native?: string }) => {
    setMessage(prev => prev + (emoji.native || ''));
    setShowEmojiPicker(false);
  };

  // Nouveaux handlers pour les fonctionnalités avancées
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await chatApi.reactToMessage(messageId, emoji);
      // Mettre à jour localement
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);
          const userId = localStorage.getItem('userId') || '';
          
          if (existingReaction) {
            if (existingReaction.users.includes(userId)) {
              // Retirer la réaction
              return {
                ...msg,
                reactions: reactions.map(r => 
                  r.emoji === emoji 
                    ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== userId) }
                    : r
                ).filter(r => r.count > 0)
              };
            } else {
              // Ajouter la réaction
              return {
                ...msg,
                reactions: reactions.map(r => 
                  r.emoji === emoji 
                    ? { ...r, count: r.count + 1, users: [...r.users, userId] }
                    : r
                )
              };
            }
          } else {
            // Nouvelle réaction
            return {
              ...msg,
              reactions: [...reactions, { emoji, count: 1, users: [userId] }]
            };
          }
        }
        return msg;
      }));
    } catch (error) {
      console.error("Erreur réaction:", error);
      toast.error("Impossible d'ajouter la réaction");
    }
  };

  const handleReply = (messageId: string, content: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      setReplyTo({
        id: messageId,
        content: content,
        senderName: msg.senderName || 'Utilisateur'
      });
    }
  };

  const handleForward = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      setForwardMessage({
        id: messageId,
        content: msg.content
      });
    }
  };

  const handleForwardToConversations = async (conversationIds: string[], content: string) => {
    try {
      for (const convId of conversationIds) {
        await chatApi.sendMessage(convId, content, 'TEXT');
      }
    } catch (error) {
      console.error("Erreur transfert:", error);
      toast.error("Erreur lors du transfert");
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message supprimé");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Impossible de supprimer le message");
    }
  };

  const handleStar = async (messageId: string) => {
    try {
      await chatApi.starMessage(messageId);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, starred: !m.starred } : m
      ));
      toast.success("Message marqué");
    } catch (error) {
      console.error("Erreur marquage:", error);
      toast.error("Impossible de marquer le message");
    }
  };

  const handleTyping = () => {
    if (!selectedConvo) return;
    
    // Envoyer l'indicateur de frappe
    chatApi.sendTypingIndicator(selectedConvo).catch(err => 
      console.error("Erreur indicateur frappe:", err)
    );
    
    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      // L'indicateur disparaît après 3 secondes
    }, 3000);
  };

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartRecording = () => {
    setShowAudioRecorder(true);
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!selectedConvo) return;
    
    try {
      setSending(true);
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('conversationId', selectedConvo);
      formData.append('type', 'AUDIO');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }
      
      const result = await response.json();
      await chatApi.sendMessage(selectedConvo, result.url || 'Message audio', 'AUDIO');
      
      toast.success('Message audio envoyé');
    } catch (error) {
      console.error("Erreur upload audio:", error);
      toast.error("Erreur lors de l'envoi du message audio");
    } finally {
      setSending(false);
      setShowAudioRecorder(false);
    }
  };
  
  const handleStopRecording = () => {
    const win = window as { stopAudioRecording?: () => void };
    if (win.stopAudioRecording) {
      win.stopAudioRecording();
      delete win.stopAudioRecording;
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleStartAudioCall = () => {
    if (!convo) return;
    setShowAudioCall(true);
    toast.info("Démarrage de l'appel audio...");
  };

  const handleStartVideoCall = () => {
    if (!convo) return;
    setShowVideoCall(true);
    toast.info("Démarrage de l'appel vidéo...");
  };

  const handleConversationCreated = (conversationId: string) => {
    // Recharger les conversations
    const loadConversations = async () => {
      try {
        const data: unknown = await chatApi.getConversations();
        if (Array.isArray(data)) {
          setConversations(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          setConversations(data.data);
        }
      } catch (error) {
        console.error("Erreur rechargement conversations:", error);
      }
    };
    loadConversations();
    setSelectedConvo(conversationId);
  };

  const convo = selectedConvo ? conversations.find(c => c.id === selectedConvo) : null;
  
  // Obtenir le nom d'affichage pour une conversation
  const getConversationDisplayName = (conversation: Conversation): string => {
    if (conversation.type === 'GROUP') {
      return conversation.groupName || 'Groupe';
    }
    
    const currentUserId = localStorage.getItem('userId');
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    
    if (otherUserId && userProfiles[otherUserId]) {
      return userProfiles[otherUserId].username || userProfiles[otherUserId].fullname || otherUserId;
    }
    
    return otherUserId || 'Utilisateur';
  };
  
  // Obtenir l'ID de l'autre utilisateur dans une conversation privée
  const getOtherUserId = (conversation: Conversation): string | null => {
    if (conversation.type === 'GROUP') return null;
    const currentUserId = localStorage.getItem('userId');
    return conversation.participants.find(id => id !== currentUserId) || null;
  };

  const conversationList = (
    <div className={`${isMobile && selectedConvo ? "hidden" : "flex"} flex-col h-full ${!isMobile ? "w-96 border-r" : "w-full"}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <button 
            onClick={() => setShowNewConversation(true)}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Aucune conversation</p>
            <p className="text-xs text-muted-foreground mt-2">Commencez une nouvelle conversation</p>
          </div>
        ) : (
          conversations.map((c) => {
            const displayName = getConversationDisplayName(c);
            const avatar = displayName.substring(0, 2).toUpperCase();
            const lastMessageTime = c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
            
            return (
              <button
                key={c.id}
                onClick={() => setSelectedConvo(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
                  selectedConvo === c.id ? "bg-muted/70" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                    {avatar}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground truncate">{displayName}</span>
                    <span className={`text-xs shrink-0 ${c.unreadCount > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>{lastMessageTime}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-muted-foreground truncate">{c.lastMessage || "Aucun message"}</p>
                    {c.unreadCount > 0 && (
                      <span className="ml-2 min-w-[20px] h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold px-1.5 shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const chatView = (
    <div className={`flex-1 flex flex-col h-full ${!selectedConvo && !isMobile ? "items-center justify-center" : ""} ${isMobile && !selectedConvo ? "hidden" : ""}`}>
      {!selectedConvo && !isMobile ? (
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Send className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Tes messages</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Sélectionne une conversation ou commence-en une nouvelle pour discuter.
          </p>
        </div>
      ) : selectedConvo && (
        <>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
            {isMobile && (
              <button onClick={() => setSelectedConvo(null)} className="p-1.5 -ml-1 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs">
                {convo ? getConversationDisplayName(convo).substring(0, 2).toUpperCase() : '??'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {convo ? getConversationDisplayName(convo) : 'Conversation'}
              </p>
              {convo?.type === 'PRIVATE' && getOtherUserId(convo) ? (
                <OnlineStatus 
                  isOnline={onlineUsers[getOtherUserId(convo)!] || false}
                  lastSeen={new Date(Date.now() - 300000)}
                  size="sm"
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {convo?.type === 'GROUP' ? `${convo.participants.length} membres` : 'Conversation privée'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleStartAudioCall}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={handleStartVideoCall}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <VideoIcon className="w-4 h-4" />
              </button>
              
              {/* Bouton Info pour afficher le profil sidebar */}
              {convo && convo.type === 'PRIVATE' && getOtherUserId(convo) && (
                <button 
                  onClick={() => setShowProfileSidebar(!showProfileSidebar)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
              
              {/* Menu trois points avec option de voir le profil */}
              {convo && convo.type === 'PRIVATE' && getOtherUserId(convo) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewProfile(getOtherUserId(convo)!)}>
                      <User className="w-4 h-4 mr-2" />
                      Voir le profil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {convo && convo.type === 'GROUP' && (
                <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-background">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun message</p>
                <p className="text-xs mt-2">Commencez la conversation !</p>
              </div>
            ) : (
              <>
                <div className="text-center py-2">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Aujourd'hui</span>
                </div>
                {messages.map((msg) => {
                  const userId = localStorage.getItem('userId');
                  const isMe = msg.senderId === userId;
                  const isSeen = msg.seenBy.length > 1;
                  const messageTime = new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  
                  // Obtenir le nom de l'expéditeur
                  const senderProfile = userProfiles[msg.senderId];
                  const senderName = msg.senderName || senderProfile?.username || senderProfile?.fullname || 'Utilisateur';
                  
                  // Vérifier si c'est un fichier média
                  const isImage = msg.type === 'IMAGE' || (msg.content && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content));
                  const isAudio = msg.type === 'AUDIO' || (msg.content && /\.(mp3|wav|webm|ogg)$/i.test(msg.content));
                  const isFile = msg.type === 'FILE' || (msg.content && msg.content.startsWith('/uploads/'));
                  
                  // Construire l'URL du média
                  const getMediaUrl = (content: string) => {
                    if (!content) return '';
                    // Si l'URL commence déjà par http, la retourner telle quelle
                    if (content.startsWith('http://') || content.startsWith('https://')) {
                      return content;
                    }
                    // Si l'URL commence par /, ajouter le base URL
                    if (content.startsWith('/')) {
                      return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${content}`;
                    }
                    // Sinon, construire le chemin complet
                    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/uploads/chat/${content}`;
                  };
                  
                  const mediaUrl = getMediaUrl(msg.content);
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <MessageContextMenu
                        messageId={msg.id}
                        messageContent={msg.content}
                        isMe={isMe}
                        onReply={handleReply}
                        onForward={handleForward}
                        onDelete={handleDelete}
                        onStar={handleStar}
                      >
                        <div className={`max-w-[75%] lg:max-w-[60%] ${
                          isMe ? "items-end" : "items-start"
                        } flex flex-col gap-1`}>
                          <div className={`px-3.5 py-2 text-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-card text-card-foreground rounded-2xl rounded-bl-md shadow-sm"
                          }`}>
                            {!isMe && convo?.type === 'GROUP' && (
                              <p className="text-xs font-semibold mb-1 opacity-70">{senderName}</p>
                            )}
                            
                            {/* Afficher le message auquel on répond */}
                            {msg.replyTo && (
                              <div className="mb-2 p-2 border-l-2 border-primary/50 bg-black/10 rounded">
                                <p className="text-xs font-semibold opacity-70">{msg.replyTo.senderName}</p>
                                <p className="text-xs opacity-60 truncate">{msg.replyTo.content}</p>
                              </div>
                            )}
                            
                            {/* Badge transféré */}
                            {msg.forwarded && (
                              <p className="text-xs italic opacity-60 mb-1">Transféré</p>
                            )}
                            
                            {/* Affichage selon le type de message */}
                            {isImage ? (
                              <div className="space-y-1">
                                <img 
                                  src={mediaUrl}
                                  alt="Image"
                                  className="rounded-lg max-w-full max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedImage(mediaUrl)}
                                  onError={(e) => {
                                    console.error('Erreur chargement image:', mediaUrl);
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage indisponible%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              </div>
                            ) : isAudio ? (
                              <AudioPlayer 
                                audioUrl={mediaUrl}
                                isMe={isMe}
                              />
                            ) : isFile ? (
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                <a 
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:opacity-80"
                                >
                                  {msg.content.split('/').pop()}
                                </a>
                              </div>
                            ) : (
                              <p className="leading-relaxed">{msg.content}</p>
                            )}
                            
                            <div className={`flex items-center gap-1 justify-end mt-1 ${
                              isMe ? "text-primary-foreground/50" : "text-muted-foreground"
                            }`}>
                              {msg.starred && <span className="text-yellow-500">⭐</span>}
                              <span className="text-[10px]">{messageTime}</span>
                              {isMe && (
                                isSeen
                                  ? <CheckCheck className="w-3 h-3 text-secondary" />
                                  : <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                          
                          {/* Réactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <MessageReactions
                              messageId={msg.id}
                              reactions={msg.reactions}
                              onReact={handleReact}
                              currentUserId={userId || ''}
                            />
                          )}
                        </div>
                      </MessageContextMenu>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
            
            {/* Indicateur de frappe */}
            {Object.entries(typingUsers).map(([userId, userName]) => (
              <TypingIndicator key={userId} userName={userName} />
            ))}
          </div>

          {/* ReplyPreview */}
          <ReplyPreview
            replyTo={replyTo}
            onCancel={() => setReplyTo(null)}
          />

          {/* Input */}
          <div className="px-4 py-3 border-t bg-card shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex items-center gap-1">
                {/* Emoji Picker */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50">
                      <Picker 
                        data={data} 
                        onEmojiSelect={handleEmojiSelect}
                        theme="auto"
                        locale="fr"
                      />
                    </div>
                  )}
                </div>
                
                {/* Image Upload */}
                <button 
                  type="button" 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Image className="w-5 h-5" />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {/* File Upload */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Écrire un message..."
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              
              {message.trim() ? (
                <button 
                  type="submit"
                  disabled={sending}
                  className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={sending}
                  className={`p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50 ${isRecording ? 'bg-destructive' : ''}`}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                </button>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-full">
      {conversationList}
      {chatView}
      
      {/* Sidebar profil */}
      {showProfileSidebar && convo && convo.type === 'PRIVATE' && getOtherUserId(convo) && (
        <ChatProfileSidebar
          userId={getOtherUserId(convo)!}
          onClose={() => setShowProfileSidebar(false)}
        />
      )}
      
      {/* Dialog pour créer une nouvelle conversation */}
      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        onConversationCreated={handleConversationCreated}
      />
      
      {/* Enregistreur audio */}
      {showAudioRecorder && (
        <AudioRecorder
          onSend={handleSendAudio}
          onCancel={() => setShowAudioRecorder(false)}
        />
      )}
      
      {/* Visionneuse d'images */}
      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
      
      {/* Dialog pour appel audio */}
      {convo && (
        <AudioCallDialog
          open={showAudioCall}
          onOpenChange={setShowAudioCall}
          userName={getConversationDisplayName(convo)}
          userAvatar={getConversationDisplayName(convo).substring(0, 2).toUpperCase()}
        />
      )}
      
      {/* Dialog pour appel vidéo */}
      {convo && (
        <VideoCallDialog
          open={showVideoCall}
          onOpenChange={setShowVideoCall}
          userName={getConversationDisplayName(convo)}
          userAvatar={getConversationDisplayName(convo).substring(0, 2).toUpperCase()}
        />
      )}
      
      {/* Dialog pour transférer un message */}
      {forwardMessage && (
        <ForwardMessageDialog
          open={!!forwardMessage}
          onOpenChange={(open) => !open && setForwardMessage(null)}
          messageId={forwardMessage.id}
          messageContent={forwardMessage.content}
          conversations={conversations}
          onForward={handleForwardToConversations}
        />
      )}
    </div>
  );
};

export default ChatPage;
