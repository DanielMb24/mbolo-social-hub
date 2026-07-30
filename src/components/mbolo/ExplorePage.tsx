import { Search, TrendingUp, Hash, UserPlus, Grid3X3, Heart, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postApi, userApi, videoApi } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'discover' | 'trending' | 'people'>('discover');
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const trendingTags = Array.from(
    posts.reduce((map, post) => {
      String(post.content || '').match(/#[\wÀ-ÿ]+/g)?.forEach((tag) => {
        const normalized = tag.toLowerCase();
        map.set(normalized, (map.get(normalized) || 0) + 1);
      });
      return map;
    }, new Map<string, number>())
  )
    .map(([tag, count]) => ({ tag, posts: `${count} publication${count > 1 ? 's' : ''}` }))
    .sort((a, b) => Number(b.posts.split(' ')[0]) - Number(a.posts.split(' ')[0]));

  const loadPosts = async () => {
    try {
      setLoading(true);
      const [data, userRows] = await Promise.all([
        postApi.getFeed(0, 30),
        userApi.searchUsers(""),
      ]);
      setPosts(Array.isArray(data) ? data : []);
      setUsers(userRows);
    } catch {
      setPosts([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Search Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des contenus, hashtags, personnes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {(['discover', 'trending', 'people'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab === 'discover' && <Grid3X3 className="w-4 h-4" />}
                {tab === 'trending' && <TrendingUp className="w-4 h-4" />}
                {tab === 'people' && <UserPlus className="w-4 h-4" />}
                {tab === 'discover' ? 'Découvrir' : tab === 'trending' ? 'Tendances' : 'Personnes'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'discover' && (
          <div className="p-2">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Chargement...
              </div>
            ) : posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Grid3X3 className="w-10 h-10 text-primary-foreground" />
                </div>
                <p className="text-xl font-bold text-foreground mb-2">Explorez MBolo</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Découvrez les contenus tendances, les hashtags populaires et les personnes à suivre
                </p>
              </div>
            ) : (
              <div className={`grid gap-1 ${isMobile ? "grid-cols-3" : "grid-cols-3 md:grid-cols-4"}`}>
                {posts.map((post, idx) => {
                  const isLarge = idx % 7 === 0;
                  return (
                    <div
                      key={post.id || idx}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className={`relative aspect-square bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-sm overflow-hidden cursor-pointer group ${
                        isLarge && !isMobile ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      {/* Content preview */}
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <p className="text-xs text-center text-foreground/80 line-clamp-4 font-medium">{post.content}</p>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-4 text-background font-semibold text-sm">
                          <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-current" />{post.likes?.length || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{post.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="p-4 space-y-3">
            <h3 className="font-bold text-foreground text-lg mb-4">🔥 Hashtags tendances</h3>
            {trendingTags.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucun hashtag pour le moment</div>
            ) : trendingTags.map((item, idx) => (
              <div key={item.tag} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                <span className="text-lg font-bold text-muted-foreground w-8">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">{item.tag}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.posts} publications</p>
                </div>
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'people' && (
          <div className="p-4 space-y-3">
            <h3 className="font-bold text-foreground text-lg mb-4">Suggestions pour toi</h3>
            {users.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucun utilisateur à suggérer</div>
            ) : users.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{user.fullname}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.bio}</p>
                </div>
                <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
                  Suivre
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
