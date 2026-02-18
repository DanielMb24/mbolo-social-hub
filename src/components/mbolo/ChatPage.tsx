import { Send, Phone, VideoIcon, MoreVertical } from "lucide-react";
import { useState } from "react";

const MOCK_CONVERSATIONS = [
  { id: "1", name: "Aimée Nzang", lastMessage: "On se voit demain ?", time: "14:32", unread: 2, avatar: "AN" },
  { id: "2", name: "Groupe Famille", lastMessage: "Patrick: Bonne nuit à tous", time: "22:10", unread: 0, avatar: "GF" },
  { id: "3", name: "Kevin Moussavou", lastMessage: "Le lien du projet", time: "09:15", unread: 1, avatar: "KM" },
  { id: "4", name: "Sophie Mba", lastMessage: "Merci beaucoup ! 🙏", time: "Hier", unread: 0, avatar: "SM" },
];

const MOCK_MESSAGES = [
  { id: "1", senderId: "other", content: "Salut ! Tu es dispo ce soir ?", time: "14:28" },
  { id: "2", senderId: "me", content: "Oui, je suis libre après 18h", time: "14:30" },
  { id: "3", senderId: "other", content: "Parfait ! On se retrouve au spot habituel ?", time: "14:31" },
  { id: "4", senderId: "me", content: "Ça marche ! À tout à l'heure 👋", time: "14:32" },
  { id: "5", senderId: "other", content: "On se voit demain ?", time: "14:32" },
];

const ChatPage = () => {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (selectedConvo) {
    const convo = MOCK_CONVERSATIONS.find(c => c.id === selectedConvo);
    return (
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
          <button onClick={() => setSelectedConvo(null)} className="text-primary font-medium text-sm">
            ← Retour
          </button>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs">
            {convo?.avatar}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">{convo?.name}</p>
            <p className="text-xs text-success">En ligne</p>
          </div>
          <button className="p-1.5 text-muted-foreground"><Phone className="w-4 h-4" /></button>
          <button className="p-1.5 text-muted-foreground"><VideoIcon className="w-4 h-4" /></button>
          <button className="p-1.5 text-muted-foreground"><MoreVertical className="w-4 h-4" /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                msg.senderId === "me"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card text-card-foreground rounded-bl-md"
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.senderId === "me" ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t bg-background">
          <div className="flex items-center gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 px-4 py-2.5 rounded-full bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="px-4 py-3">
        <input
          placeholder="Rechercher une conversation..."
          className="w-full px-4 py-2.5 rounded-full bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {MOCK_CONVERSATIONS.map((convo) => (
        <button
          key={convo.id}
          onClick={() => setSelectedConvo(convo.id)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm shrink-0">
            {convo.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">{convo.name}</span>
              <span className="text-xs text-muted-foreground">{convo.time}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
              {convo.unread > 0 && (
                <span className="ml-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                  {convo.unread}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ChatPage;
