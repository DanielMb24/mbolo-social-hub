import { Search, TrendingUp, Hash, UserPlus, Grid3X3, Heart, MessageCircle, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postApi, userApi, videoApi } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

const TRENDING_TAGS = [
  { tag: '#MBolo', posts: '2.4k' },
  { tag: '#Gabon', posts: '1.8k' },
  { tag: '#Libreville', posts: '1.2k' },
  { tag: '#Musique', posts: '956' },
  { tag: '#Culture', posts: '823' },
  { tag: '#Sport', posts: '654' },
  { tag: '#Food', posts: '432' },
  { tag: '#Danse', posts: '321' },
];

const SUGGESTED_USERS = [
  { id: '1', username: 'flavy_m', fullname: 'Flavy Moukagny', bio: 'Artiste & créatrice' },
  { id: '2', username: 'roro_ndg', fullname: 'Roro Ndg', bio: 'Photographe' },
  { id: '3', username: 'oriana_k', fullname: 'Oriana Krm', bio: 'Influenceuse lifestyle' },
];

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'discover' | 'trending' | 'people'>('discover');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    // Posts de démonstration par défaut
    const demoPosts = [
      {
        id: 'demo-1',
        content: 'Bienvenue sur MBolo ! 🎉 Découvrez les tendances au Gabon',
        likes: ['demo'],
        commentsCount: 12,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-2',
        content: 'Libreville by night 🌃 #Gabon #Libreville',
        likes: [],
        commentsCount: 8,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-3',
        content: 'La culture gabonaise est riche et diversifiée 🇬🇦',
        likes: [],
        commentsCount: 15,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-4',
        content: 'Musique gabonaise 🎵 #MBolo #Musique',
        likes: [],
        commentsCount: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-5',
        content: 'Sport et passion ⚽ #Sport #Gabon',
        likes: [],
        commentsCount: 20,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-6',
        content: 'Cuisine traditionnelle gabonaise 🍲',
        likes: [],
        commentsCount: 18,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-7',
        content: 'Mode africaine et créateurs locaux 👗',
        likes: [],
        commentsCount: 9,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-8',
        content: 'Innovation technologique au Gabon 💻',
        likes: [],
        commentsCount: 14,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-9',
        content: 'Nature et biodiversité gabonaise 🌴',
        likes: [],
        commentsCount: 22,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-10',
        content: 'Art contemporain gabonais 🎨',
        likes: [],
        commentsCount: 11,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-11',
        content: 'Entrepreneuriat au Gabon 💼',
        likes: [],
        commentsCount: 16,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-12',
        content: 'Tourisme et découverte 🏖️',
        likes: [],
        commentsCount: 19,
        createdAt: new Date().toISOString()
      }
    ];

    try {
      setLoading(true);
      const data = await postApi.getFeed(0, 30);
      // Si on a des posts réels, les afficher, sinon afficher les démos
      setPosts(data && data.length > 0 ? data : demoPosts);
    } catch {
      // En cas d'erreur, afficher les posts de démonstration
      setPosts(demoPosts);
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
            {TRENDING_TAGS.map((item, idx) => (
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
            {SUGGESTED_USERS.map(user => (
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
