import { useState, useEffect, useRef, useCallback } from "react";
import { Search, User, FileText, MessageCircle, X, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  type: "user" | "post" | "conversation";
  title: string;
  subtitle?: string;
  avatarInitials: string;
}

// Demo search function (replace with real API calls)
const searchAll = async (query: string): Promise<SearchResult[]> => {
  await new Promise(r => setTimeout(r, 200));
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  const demoData: SearchResult[] = [
    { id: "u1", type: "user", title: "Amara Koumba", subtitle: "@amara.k · Libreville", avatarInitials: "AK" },
    { id: "u2", type: "user", title: "Brice Moussavou", subtitle: "@brice.m · Port-Gentil", avatarInitials: "BM" },
    { id: "u3", type: "user", title: "Cécile Ntoumi", subtitle: "@cecile.n · Franceville", avatarInitials: "CN" },
    { id: "u4", type: "user", title: "David Ondo", subtitle: "@david.o · Libreville", avatarInitials: "DO" },
    { id: "p1", type: "post", title: "Libreville by night 🌙", subtitle: "David Ondo · 5h", avatarInitials: "DO" },
    { id: "p2", type: "post", title: "Grande nouvelle aujourd'hui !", subtitle: "Amara K. · 1j", avatarInitials: "AK" },
    { id: "c1", type: "conversation", title: "Conversation avec Amara", subtitle: "Dernier message il y a 2h", avatarInitials: "AK" },
  ];

  return demoData.filter(
    item =>
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
  );
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
}

const GlobalSearch = ({ onClose }: GlobalSearchProps) => {
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

          {/* Empty state / suggestions */}
          {!query && (
            <div className="px-4 py-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Suggestions</p>
              <div className="space-y-1">
                {["Amara Koumba", "Libreville", "Brice M."].map(s => (
                  <button
                    key={s}
                    onClick={() => handleChange(s)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
