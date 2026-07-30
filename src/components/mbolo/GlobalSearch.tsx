import { useState, useEffect, useRef, useCallback } from "react";
import { Search, User, FileText, MessageCircle, X, Loader2 } from "lucide-react";
import { searchApi, type Conversation, type Post, type UserProfile } from "@/lib/api";

interface SearchResult {
  id: string;
  type: "user" | "post" | "conversation";
  title: string;
  subtitle?: string;
  avatarInitials: string;
  targetTab?: "feed" | "chat" | "profile";
  targetId?: string;
}

const searchAll = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  const { users, posts, conversations } = await searchApi.global(query).catch(() => ({
    users: [],
    posts: [],
    conversations: [],
  }));

  const userResults = users.map((user: UserProfile) => ({
    id: user.id,
    type: "user" as const,
    title: user.fullname || user.username || "Utilisateur",
    subtitle: `@${user.username || user.id.slice(0, 8)}${user.location ? ` · ${user.location}` : ''}`,
    avatarInitials: (user.username || user.id || "U").slice(0, 2).toUpperCase(),
    targetTab: "profile" as const,
    targetId: user.id,
  }));

  const postResults = posts
    .slice(0, 10)
    .map((post: Post) => ({
      id: post.id,
      type: "post" as const,
      title: String(post.content || "Publication").slice(0, 80),
      subtitle: new Date(post.createdAt).toLocaleDateString('fr-FR'),
      avatarInitials: String(post.authorId || "U").slice(0, 2).toUpperCase(),
      targetTab: "feed" as const,
      targetId: post.id,
    }));

  const conversationResults = conversations
    .slice(0, 5)
    .map((conversation: Conversation) => ({
      id: conversation.id,
      type: "conversation" as const,
      title: conversation.groupName || "Conversation",
      subtitle: typeof conversation.lastMessage === "string" ? conversation.lastMessage : "Discussion",
      avatarInitials: String(conversation.groupName || conversation.id || "C").slice(0, 2).toUpperCase(),
      targetTab: "chat" as const,
      targetId: conversation.id,
    }));

  return [...userResults, ...postResults, ...conversationResults];
};

const iconForType = (type: SearchResult["type"]) => {
  switch (type) {
    case "user": return <User className="w-3.5 h-3.5 text-primary" />;
    case "post": return <FileText className="w-3.5 h-3.5 text-secondary-foreground" />;
    case "conversation": return <MessageCircle className="w-3.5 h-3.5 text-accent-foreground" />;
  }
};

const labelForType = (type: SearchResult["type"]) => {
  switch (type) {
    case "user": return "Utilisateur";
    case "post": return "Publication";
    case "conversation": return "Message";
  }
};

interface GlobalSearchProps {
  onClose: () => void;
  onNavigate?: (result: SearchResult) => void;
}

const GlobalSearch = ({ onClose, onNavigate }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce 300ms
  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchAll(value);
      setResults(res);
      setLoading(false);
    }, 300);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const grouped = {
    user: results.filter(r => r.type === "user"),
    post: results.filter(r => r.type === "post"),
    conversation: results.filter(r => r.type === "conversation"),
  };

  const hasResults = results.length > 0;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-16 px-4 bg-foreground/30 backdrop-blur-sm">
      <div ref={panelRef} className="w-full max-w-xl">
        {/* Search input */}
        <div className="relative bg-card border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b">
            {loading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
            ) : (
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleChange(e.target.value)}
              placeholder="Rechercher utilisateurs, posts, messages..."
              className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button onClick={() => handleChange("")} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
            >
              Annuler
            </button>
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="max-h-[60vh] overflow-y-auto">
              {!hasResults && !loading && (
                <div className="py-10 text-center">
                  <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">Aucun résultat pour « {query} »</p>
                </div>
              )}

              {(["user", "post", "conversation"] as const).map(type => {
                const group = grouped[type];
                if (group.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="px-4 py-2 bg-muted/40">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {labelForType(type)}s
                      </span>
                    </div>
                    {group.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate?.(item);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs">
                            {item.avatarInitials}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
                            {iconForType(item.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {!query && (
            <div className="px-4 py-6">
              <p className="text-sm text-muted-foreground text-center">Tapez pour rechercher dans vos utilisateurs, publications et conversations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
