import { Send, Phone, VideoIcon, MoreVertical, Search, Plus, Image, Mic, Smile, ArrowLeft, Check, CheckCheck, Loader2, Paperclip, User, Info, ThumbsUp } from "lucide-react";
import { lazy, Suspense, useCallback, useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { chatApi, type Conversation, type Message } from "@/lib/chat-api";
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
import { api, userApi, type UserProfile } from "@/lib/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const EmojiPickerPanel = lazy(() => import("./EmojiPickerPanel"));

const CHAT_POLL_INTERVAL_MS = 4000;

const unwrapMessages = (data: unknown): Message[] => {
  let msgs: Message[] = [];
  if (data && typeof data === 'object') {
    const dataObj = data as { data?: unknown; content?: unknown };
    if (dataObj.data && typeof dataObj.data === 'object') {
      const nested = dataObj.data as { content?: unknown };
      if (Array.isArray(nested.content)) msgs = nested.content as Message[];
    } else if (Array.isArray(dataObj.content)) msgs = dataObj.content as Message[];
    else if (Array.isArray(dataObj.data)) msgs = dataObj.data as Message[];
    else if (Array.isArray(data)) msgs = data as Message[];
  }
  return msgs.reverse();
};

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollInFlightRef = useRef(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Charger les profils utilisateurs
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await userApi.getProfile(userId);
      setUserProfiles(prev => (prev[userId] ? prev : { ...prev, [userId]: profile }));
      return profile;
    } catch (error) {
      return null;
    }
  }, []);

  // Charger les conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await chatApi.getConversations();
        let convos: Conversation[] = [];
        if (Array.isArray(data)) {
          convos = data;
        } else if (data && typeof data === 'object') {
          const dataObj = data as { data?: unknown; content?: unknown };
          if (Array.isArray(dataObj.data)) convos = dataObj.data as Conversation[];
          else if (Array.isArray(dataObj.content)) convos = dataObj.content as Conversation[];
        }
        setConversations(convos);
        if (convos.length > 0) {
          const userIds = new Set<string>();
          convos.forEach(c => c.participants.forEach(uid => userIds.add(uid)));
          Array.from(userIds).forEach(uid => fetchUserProfile(uid));
        }
      } catch (error) {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, [fetchUserProfile]);

  const refreshMessages = useCallback(async (conversationId: string, options: { clearOnError?: boolean; markSeen?: boolean } = {}) => {
    if (pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    try {
      const data = await chatApi.getMessages(conversationId, 0, 50);
      const nextMessages = unwrapMessages(data);
      setMessages(prev => {
        const prevSignature = prev.map(msg => `${msg.id}:${msg.updatedAt || msg.createdAt}:${msg.reactions?.length || 0}:${msg.seenBy?.length || 0}`).join("|");
        const nextSignature = nextMessages.map(msg => `${msg.id}:${msg.updatedAt || msg.createdAt}:${msg.reactions?.length || 0}:${msg.seenBy?.length || 0}`).join("|");
        return prevSignature === nextSignature ? prev : nextMessages;
      });
      if (options.markSeen !== false) {
        chatApi.markConversationAsSeen(conversationId).catch(() => {});
      }
    } catch {
      if (options.clearOnError) setMessages([]);
    } finally {
      pollInFlightRef.current = false;
    }
  }, []);

  // Charger les messages et rafraîchir par polling compatible Vercel.
  useEffect(() => {
    if (!selectedConvo) return;
    let active = true;
    const tick = () => {
      if (!active || document.visibilityState === "hidden") return;
      refreshMessages(selectedConvo, { clearOnError: messages.length === 0 }).catch(() => undefined);
    };
    tick();
    const intervalId = window.setInterval(tick, CHAT_POLL_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [selectedConvo, refreshMessages, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConvo) return;
    const messageContent = message.trim();
    setMessage('');
    setSending(true);
    try {
      const sent = await chatApi.sendMessage(selectedConvo, messageContent);
      if (sent?.id) setMessages(prev => prev.some(msg => msg.id === sent.id) ? prev : [...prev, sent]);
      refreshMessages(selectedConvo, { markSeen: false }).catch(() => undefined);
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
      setMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'IMAGE' | 'FILE') => {
    if (!selectedConvo) return;
    try {
      setSending(true);
      const result = await api.uploadFile('/api/chat/upload', file, { conversationId: selectedConvo, type });
      if (result.url) {
        const sent = await chatApi.sendMessage(selectedConvo, result.url, type);
        if (sent?.id) setMessages(prev => prev.some(msg => msg.id === sent.id) ? prev : [...prev, sent]);
        refreshMessages(selectedConvo, { markSeen: false }).catch(() => undefined);
        toast.success(type === 'IMAGE' ? 'Image envoyée' : 'Fichier envoyé');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) handleFileUpload(file, 'IMAGE');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'FILE');
  };

  const handleEmojiSelect = (emoji: { native?: string }) => {
    setMessage(prev => prev + (emoji.native || ''));
    setShowEmojiPicker(false);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await chatApi.reactToMessage(messageId, emoji);
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions || [];
        const userId = localStorage.getItem('userId') || '';
        const existing = reactions.find(r => r.emoji === emoji);
        if (existing) {
          if (existing.users.includes(userId)) {
            return { ...msg, reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== userId) } : r).filter(r => r.count > 0) };
          }
          return { ...msg, reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, userId] } : r) };
        }
        return { ...msg, reactions: [...reactions, { emoji, count: 1, users: [userId] }] };
      }));
    } catch { toast.error("Impossible d'ajouter la réaction"); }
  };

  const handleReply = (messageId: string, content: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) setReplyTo({ id: messageId, content, senderName: msg.senderName || 'Utilisateur' });
  };

  const handleForward = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) setForwardMessage({ id: messageId, content: msg.content });
  };

  const handleForwardToConversations = async (conversationIds: string[], content: string) => {
    try {
      for (const convId of conversationIds) await chatApi.sendMessage(convId, content, 'TEXT');
    } catch { toast.error("Erreur lors du transfert"); }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message supprimé");
    } catch { toast.error("Impossible de supprimer"); }
  };

  const handleStar = async (messageId: string) => {
    try {
      await chatApi.starMessage(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, starred: !m.starred } : m));
    } catch { toast.error("Impossible de marquer"); }
  };

  const handleTyping = () => {
    if (!selectedConvo) return;
    chatApi.sendTypingIndicator(selectedConvo).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!selectedConvo) return;
    try {
      setSending(true);
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
      const result = await api.uploadFile('/api/chat/upload', audioFile, { conversationId: selectedConvo, type: 'AUDIO' });
      if (result.url) {
        const sent = await chatApi.sendMessage(selectedConvo, result.url, 'AUDIO');
        if (sent?.id) setMessages(prev => prev.some(msg => msg.id === sent.id) ? prev : [...prev, sent]);
        refreshMessages(selectedConvo, { markSeen: false }).catch(() => undefined);
        toast.success('Message audio envoyé');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi audio");
    } finally {
      setSending(false);
      setShowAudioRecorder(false);
    }
  };

  const handleConversationCreated = (conversationId: string) => {
    const reload = async () => {
      try {
        const result: unknown = await chatApi.getConversations();
        if (Array.isArray(result)) setConversations(result as Conversation[]);
        else if (result && typeof result === 'object') {
          const obj = result as { data?: unknown };
          if (Array.isArray(obj.data)) setConversations(obj.data as Conversation[]);
        }
      } catch (error) {
        console.warn("Impossible de recharger les conversations", error);
      }
    };
    reload();
    setSelectedConvo(conversationId);
  };

  const convo = selectedConvo ? conversations.find(c => c.id === selectedConvo) : null;

  const getConversationDisplayName = (conversation: Conversation): string => {
    if (conversation.type === 'GROUP') return conversation.groupName || 'Groupe';
    const currentUserId = localStorage.getItem('userId');
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    if (otherUserId && userProfiles[otherUserId]) {
      return userProfiles[otherUserId].username || userProfiles[otherUserId].fullname || otherUserId;
    }
    return otherUserId || 'Utilisateur';
  };

  const getOtherUserId = (conversation: Conversation): string | null => {
    if (conversation.type === 'GROUP') return null;
    const currentUserId = localStorage.getItem('userId');
    return conversation.participants.find(id => id !== currentUserId) || null;
  };

  const filteredConversations = conversations.filter(c => {
    const name = getConversationDisplayName(c).toLowerCase();
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
    if (activeFilter === 'unread') return matchesSearch && c.unreadCount > 0;
    if (activeFilter === 'groups') return matchesSearch && c.type === 'GROUP';
    return matchesSearch;
  });

  const getMediaUrl = (content: string) => {
    if (!content) return '';
    if (content.startsWith('http://') || content.startsWith('https://')) return content;
    if (content.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${content}`;
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/uploads/chat/${content}`;
  };

  // ─── CONVERSATION LIST ────────────────────────────────────────
  const conversationList = (
    <div className={`${isMobile && selectedConvo ? "hidden" : "flex"} flex-col h-full ${!isMobile ? "w-[360px] border-r" : "w-full"} bg-card`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-foreground">Discussions</h2>
          <div className="flex items-center gap-1">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNewConversation(true)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans Messenger"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-1">
          {(['all', 'unread', 'groups'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeFilter === filter
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {filter === 'all' ? 'Tout' : filter === 'unread' ? 'Non lu' : 'Groupes'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Aucune conversation</p>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const displayName = getConversationDisplayName(c);
            const avatar = displayName.substring(0, 2).toUpperCase();
            const lastMsgTime = c.lastMessageTime
              ? new Date(c.lastMessageTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : '';
            const isActive = selectedConvo === c.id;
            const otherUserId = getOtherUserId(c);
            const isOnline = otherUserId ? onlineUsers[otherUserId] : false;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedConvo(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all text-left ${
                  isActive ? "bg-primary/10" : "hover:bg-muted/60"
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary/20 text-secondary"
                  }`}>
                    {avatar}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${c.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                      {displayName}
                    </span>
                    <span className={`text-[11px] shrink-0 ${c.unreadCount > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {lastMsgTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-[13px] truncate ${c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {c.lastMessage || "Aucun message"}
                    </p>
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

  // ─── CHAT VIEW ────────────────────────────────────────────────
  const chatView = (
    <div className={`flex-1 flex flex-col h-full ${!selectedConvo && !isMobile ? "items-center justify-center" : ""} ${isMobile && !selectedConvo ? "hidden" : ""}`}>
      {!selectedConvo && !isMobile ? (
        <div className="text-center p-12">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Send className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Tes messages</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Envoie des messages privés à un ami ou à un groupe. Les messages sont sécurisés et chiffrés.
          </p>
          <button
            onClick={() => setShowNewConversation(true)}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Envoyer un message
          </button>
        </div>
      ) : selectedConvo && (
        <>
          {/* ─── Chat Header ─── */}
          <div className="flex items-center gap-3 px-4 h-[60px] border-b bg-card shrink-0">
            {isMobile && (
              <button onClick={() => setSelectedConvo(null)} className="p-1.5 -ml-1 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div className="relative cursor-pointer" onClick={() => convo?.type === 'PRIVATE' && getOtherUserId(convo) && setShowProfileSidebar(true)}>
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-semibold text-sm">
                {convo ? getConversationDisplayName(convo).substring(0, 2).toUpperCase() : '??'}
              </div>
              {convo?.type === 'PRIVATE' && getOtherUserId(convo) && onlineUsers[getOtherUserId(convo)!] && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => convo?.type === 'PRIVATE' && getOtherUserId(convo) && setShowProfileSidebar(true)}>
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
            <div className="flex items-center gap-0.5">
              <button onClick={() => setShowAudioCall(true)} className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button onClick={() => setShowVideoCall(true)} className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors">
                <VideoIcon className="w-5 h-5" />
              </button>
              {convo && convo.type === 'PRIVATE' && getOtherUserId(convo) && (
                <button
                  onClick={() => setShowProfileSidebar(!showProfileSidebar)}
                  className={`p-2 rounded-full transition-colors ${showProfileSidebar ? "text-primary bg-primary/10" : "text-primary hover:bg-primary/10"}`}
                >
                  <Info className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* ─── Messages Area ─── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-background">
            {/* Encryption notice */}
            <div className="text-center py-6 mb-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-lg">
                  {convo ? getConversationDisplayName(convo).substring(0, 2).toUpperCase() : '??'}
                </div>
              </div>
              <p className="font-bold text-foreground text-lg">{convo ? getConversationDisplayName(convo) : ''}</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
                🔒 Les messages sont sécurisés avec le chiffrement de bout en bout.
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Envoyez votre premier message !</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const userId = localStorage.getItem('userId');
                  const isMe = msg.senderId === userId;
                  const isSeen = msg.seenBy.length > 1;
                  const messageTime = new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  const senderProfile = userProfiles[msg.senderId];
                  const senderName = msg.senderName || senderProfile?.username || 'Utilisateur';

                  const isImage = msg.type === 'IMAGE' || (msg.content && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content));
                  const isAudio = msg.type === 'AUDIO' || (msg.content && /\.(mp3|wav|webm|ogg)$/i.test(msg.content));
                  const isFile = msg.type === 'FILE' || (msg.content && msg.content.startsWith('/uploads/'));
                  const mediaUrl = getMediaUrl(msg.content);

                  // Show date separator
                  const showDateSep = idx === 0 || (
                    new Date(messages[idx - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString()
                  );

                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="text-center py-3">
                          <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
                            {new Date(msg.createdAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5 group`}>
                        <MessageContextMenu
                          messageId={msg.id}
                          messageContent={msg.content}
                          isMe={isMe}
                          onReply={handleReply}
                          onForward={handleForward}
                          onDelete={handleDelete}
                          onStar={handleStar}
                        >
                          <div className={`max-w-[70%] lg:max-w-[55%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {!isMe && convo?.type === 'GROUP' && (
                              <p className="text-[11px] font-semibold text-muted-foreground ml-3 mb-0.5">{senderName}</p>
                            )}
                            <div className={`px-3 py-2 text-[14px] leading-relaxed ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-[18px] rounded-br-sm"
                                : "bg-muted text-foreground rounded-[18px] rounded-bl-sm"
                            }`}>
                              {msg.replyTo && (
                                <div className={`mb-1.5 p-1.5 border-l-2 rounded ${isMe ? "border-primary-foreground/40 bg-primary-foreground/10" : "border-primary/40 bg-primary/5"}`}>
                                  <p className="text-[11px] font-semibold opacity-70">{msg.replyTo.senderName}</p>
                                  <p className="text-[11px] opacity-60 truncate">{msg.replyTo.content}</p>
                                </div>
                              )}
                              {msg.forwarded && <p className="text-[11px] italic opacity-60 mb-0.5">↪ Transféré</p>}

                              {isImage ? (
                                <img
                                  src={mediaUrl} alt="Image"
                                  className="rounded-xl max-w-full max-h-72 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedImage(mediaUrl)}
                                  onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,...'; }}
                                />
                              ) : isAudio ? (
                                <AudioPlayer audioUrl={mediaUrl} isMe={isMe} />
                              ) : isFile ? (
                                <div className="flex items-center gap-2">
                                  <Paperclip className="w-4 h-4" />
                                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 text-sm">
                                    {msg.content.split('/').pop()}
                                  </a>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              )}

                              <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMe ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                                {msg.starred && <span className="text-[10px]">⭐</span>}
                                <span className="text-[10px]">{messageTime}</span>
                                {isMe && (
                                  isSeen ? <CheckCheck className="w-3 h-3 text-secondary" /> : <Check className="w-3 h-3" />
                                )}
                              </div>
                            </div>

                            {/* Reactions */}
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
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}

            {Object.entries(typingUsers).map(([uid, name]) => (
              <TypingIndicator key={uid} userName={name} />
            ))}
          </div>

          {/* ReplyPreview */}
          <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />

          {/* ─── Input Area ─── */}
          <div className="px-3 py-2.5 border-t bg-card shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-end gap-1.5">
              {/* Left icons */}
              <div className="flex items-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50">
                      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Chargement...</div>}>
                        <EmojiPickerPanel onEmojiSelect={handleEmojiSelect} />
                      </Suspense>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors">
                  <Image className="w-5 h-5" />
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
              </div>

              {/* Message input */}
              <div className="flex-1">
                <input
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                  placeholder="Aa"
                  disabled={sending}
                  className="w-full px-4 py-2.5 rounded-full bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Right action */}
              {message.trim() ? (
                <button
                  type="submit"
                  disabled={sending}
                  className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors shrink-0 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAudioRecorder(true)}
                    disabled={sending}
                    className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors shrink-0"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors shrink-0"
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                </>
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

      {/* Profile Sidebar */}
      {!isMobile && showProfileSidebar && convo && convo.type === 'PRIVATE' && getOtherUserId(convo) && (
        <ChatProfileSidebar userId={getOtherUserId(convo)!} onClose={() => setShowProfileSidebar(false)} />
      )}

      <NewConversationDialog open={showNewConversation} onOpenChange={setShowNewConversation} onConversationCreated={handleConversationCreated} />
      {showAudioRecorder && <AudioRecorder onSend={handleSendAudio} onCancel={() => setShowAudioRecorder(false)} />}
      {selectedImage && <ImageViewer imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
      {convo && <AudioCallDialog open={showAudioCall} onOpenChange={setShowAudioCall} userName={getConversationDisplayName(convo)} userAvatar={getConversationDisplayName(convo).substring(0, 2).toUpperCase()} />}
      {convo && <VideoCallDialog open={showVideoCall} onOpenChange={setShowVideoCall} userName={getConversationDisplayName(convo)} userAvatar={getConversationDisplayName(convo).substring(0, 2).toUpperCase()} />}
      {forwardMessage && (
        <ForwardMessageDialog
          open={!!forwardMessage} onOpenChange={(open) => !open && setForwardMessage(null)}
          messageId={forwardMessage.id} messageContent={forwardMessage.content}
          conversations={conversations} onForward={handleForwardToConversations}
        />
      )}
    </div>
  );
};

export default ChatPage;
