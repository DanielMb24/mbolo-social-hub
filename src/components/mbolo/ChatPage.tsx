import { Send, Phone, VideoIcon, MoreVertical, Search, Plus, Image, Mic, Smile, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const MOCK_CONVERSATIONS = [
  { id: "1", name: "Aimée Nzang", lastMessage: "On se voit demain ?", time: "14:32", unread: 2, avatar: "AN", online: true },
  { id: "2", name: "Groupe Famille 🏠", lastMessage: "Patrick: Bonne nuit à tous", time: "22:10", unread: 0, avatar: "GF", online: false, isGroup: true },
  { id: "3", name: "Kevin Moussavou", lastMessage: "Le lien du projet", time: "09:15", unread: 1, avatar: "KM", online: true },
  { id: "4", name: "Sophie Mba", lastMessage: "Merci beaucoup ! 🙏", time: "Hier", unread: 0, avatar: "SM", online: false },
  { id: "5", name: "Tech Gabon 💻", lastMessage: "Jean: Nouveau meetup samedi", time: "Lun", unread: 5, avatar: "TG", online: false, isGroup: true },
  { id: "6", name: "Marie Lendoye", lastMessage: "Tu as vu la vidéo ?", time: "Dim", unread: 0, avatar: "ML", online: true },
];

const MOCK_MESSAGES = [
  { id: "1", senderId: "other", content: "Salut ! Tu es dispo ce soir ?", time: "14:28", status: "seen" },
  { id: "2", senderId: "me", content: "Oui, je suis libre après 18h", time: "14:30", status: "seen" },
  { id: "3", senderId: "other", content: "Parfait ! On se retrouve au spot habituel ?", time: "14:31", status: "seen" },
  { id: "4", senderId: "me", content: "Ça marche ! À tout à l'heure 👋", time: "14:32", status: "seen" },
  { id: "5", senderId: "other", content: "On se voit demain ?", time: "14:32", status: "delivered" },
];

const ChatPage = () => {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const convo = selectedConvo ? MOCK_CONVERSATIONS.find(c => c.id === selectedConvo) : null;

  const conversationList = (
    <div className={`${isMobile && selectedConvo ? "hidden" : "flex"} flex-col h-full ${!isMobile ? "w-96 border-r" : "w-full"}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
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
        {MOCK_CONVERSATIONS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedConvo(c.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
              selectedConvo === c.id ? "bg-muted/70" : ""
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                {c.avatar}
              </div>
              {c.online && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground truncate">{c.name}</span>
                <span className={`text-xs shrink-0 ${c.unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>{c.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                {c.unread > 0 && (
                  <span className="ml-2 min-w-[20px] h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold px-1.5 shrink-0">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
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
                {convo?.avatar}
              </div>
              {convo?.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{convo?.name}</p>
              <p className="text-xs text-success">{convo?.online ? "En ligne" : "Hors ligne"}</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Phone className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><VideoIcon className="w-4 h-4" /></button>
              <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><MoreVertical className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-background">
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Aujourd'hui</span>
            </div>
            {MOCK_MESSAGES.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] lg:max-w-[60%] px-3.5 py-2 text-sm ${
                  msg.senderId === "me"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-card text-card-foreground rounded-2xl rounded-bl-md shadow-sm"
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-1 justify-end mt-1 ${
                    msg.senderId === "me" ? "text-primary-foreground/50" : "text-muted-foreground"
                  }`}>
                    <span className="text-[10px]">{msg.time}</span>
                    {msg.senderId === "me" && (
                      msg.status === "seen"
                        ? <CheckCheck className="w-3 h-3 text-secondary" />
                        : <Check className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t bg-card shrink-0">
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Image className="w-5 h-5" />
                </button>
              </div>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {message.trim() ? (
                <button className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0">
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0">
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-full">
      {conversationList}
      {chatView}
    </div>
  );
};

export default ChatPage;
