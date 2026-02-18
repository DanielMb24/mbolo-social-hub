import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Smile, Bookmark, TrendingUp } from "lucide-react";
import { useState } from "react";

const MOCK_STORIES = [
  { id: "you", name: "Toi", avatar: "U", isYou: true },
  { id: "1", name: "Aimée", avatar: "AN", seen: false },
  { id: "2", name: "Patrick", avatar: "PO", seen: false },
  { id: "3", name: "Sophie", avatar: "SM", seen: true },
  { id: "4", name: "Kevin", avatar: "KM", seen: false },
  { id: "5", name: "Marie", avatar: "ML", seen: true },
];

const MOCK_POSTS = [
  {
    id: "1",
    author: "Aimée Nzang",
    handle: "@aimee_nzang",
    avatar: "AN",
    time: "Il y a 2h",
    content: "Libreville est magnifique ce soir ! 🌅 Le coucher de soleil depuis le Bord de Mer était incroyable. Qui d'autre a vu ça ? #Gabon #MBolo #Libreville",
    likes: 42,
    comments: 8,
    shares: 3,
    liked: false,
    saved: false,
  },
  {
    id: "2",
    author: "Patrick Obame",
    handle: "@patrick_ob",
    avatar: "PO",
    time: "Il y a 5h",
    content: "Qui est prêt pour le match ce weekend ? ⚽ Allez les Panthères ! On va les supporter à fond 🇬🇦💪",
    likes: 128,
    comments: 34,
    shares: 12,
    liked: true,
    saved: true,
  },
  {
    id: "3",
    author: "Sophie Mba",
    handle: "@sophie_art",
    avatar: "SM",
    time: "Il y a 1j",
    content: "Mon nouveau projet artistique prend forme. L'art gabonais a tellement à offrir au monde 🎨✨ Je travaille sur une série de masques Fang revisités en art contemporain.",
    likes: 67,
    comments: 12,
    shares: 5,
    liked: false,
    saved: false,
  },
];

const FeedPage = () => {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");

  const toggleLike = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const toggleSave = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, saved: !p.saved } : p
    ));
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        {/* Stories */}
        <div className="px-4 py-3 border-b overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {MOCK_STORIES.map((story) => (
              <button key={story.id} className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  story.isYou
                    ? "border-2 border-dashed border-muted-foreground text-muted-foreground"
                    : story.seen
                    ? "border-2 border-muted text-muted-foreground bg-muted"
                    : "bg-gradient-to-br from-secondary to-primary text-primary-foreground ring-2 ring-secondary/30"
                }`}>
                  {story.isYou ? "+" : story.avatar}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{story.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* New post composer */}
        <div className="p-4 border-b bg-card/50">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
              U
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Quoi de neuf ? Partage avec ta communauté..."
                rows={2}
                className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors">
                    <Image className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg text-accent-foreground hover:bg-accent/20 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button
                  disabled={!newPost.trim()}
                  className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 shadow-sm"
                >
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trending bar */}
        <div className="px-4 py-2.5 border-b bg-accent/5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-foreground" />
          <span className="text-xs font-semibold text-accent-foreground">Tendance :</span>
          <div className="flex gap-2 overflow-x-auto">
            {["#MBolo", "#Gabon", "#Libreville", "#CAN2025"].map(tag => (
              <span key={tag} className="text-xs text-secondary font-medium hover:underline cursor-pointer shrink-0">{tag}</span>
            ))}
          </div>
        </div>

        {/* Posts */}
        {posts.map((post) => (
          <article key={post.id} className="p-4 border-b hover:bg-card/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm shrink-0">
                {post.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-sm text-foreground truncate">{post.author}</span>
                    <span className="text-xs text-muted-foreground truncate">{post.handle}</span>
                    <span className="text-xs text-muted-foreground">· {post.time}</span>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-foreground mt-1.5 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center justify-between mt-3 max-w-sm">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-all group ${
                      post.liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                    }`}
                  >
                    <div className="p-1.5 rounded-full group-hover:bg-destructive/10 transition-colors">
                      <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
                    </div>
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-all group">
                    <div className="p-1.5 rounded-full group-hover:bg-secondary/10 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-all group">
                    <div className="p-1.5 rounded-full group-hover:bg-secondary/10 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </div>
                    {post.shares}
                  </button>
                  <button
                    onClick={() => toggleSave(post.id)}
                    className={`transition-all group ${
                      post.saved ? "text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground"
                    }`}
                  >
                    <div className="p-1.5 rounded-full group-hover:bg-accent/20 transition-colors">
                      <Bookmark className={`w-4 h-4 ${post.saved ? "fill-current" : ""}`} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Right sidebar - desktop only (trending/suggestions) */}
      <aside className="hidden xl:block w-80 shrink-0 border-l p-4 space-y-6">
        <div>
          <h3 className="font-bold text-foreground mb-3">🔥 Tendances au Gabon</h3>
          <div className="space-y-3">
            {[
              { tag: "#CAN2025", posts: "2.4k posts" },
              { tag: "#Libreville", posts: "1.8k posts" },
              { tag: "#MusiqueGabonaise", posts: "956 posts" },
              { tag: "#TechGabon", posts: "432 posts" },
            ].map(t => (
              <div key={t.tag} className="cursor-pointer hover:bg-muted rounded-lg p-2 -mx-2 transition-colors">
                <p className="text-sm font-semibold text-foreground">{t.tag}</p>
                <p className="text-xs text-muted-foreground">{t.posts}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-foreground mb-3">Suggestions</h3>
          <div className="space-y-3">
            {[
              { name: "Marie Lendoye", handle: "@marie_l", avatar: "ML" },
              { name: "Jean Ntoutoume", handle: "@jean_nt", avatar: "JN" },
            ].map(u => (
              <div key={u.handle} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs shrink-0">
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.handle}</p>
                </div>
                <button className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
                  Suivre
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default FeedPage;
