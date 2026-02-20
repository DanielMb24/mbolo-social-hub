import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Smile, Bookmark, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postApi, userApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import StoriesBar from "./StoriesBar";
import StoryCreator from "./StoryCreator";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useRateLimit } from "@/hooks/use-rate-limit";
import type { Story } from "./StoriesBar";

interface Post {
  id: string;
  authorId: string;
  author?: {
    id: string;
    username: string;
    fullname?: string;
    avatarUrl?: string;
  };
  content: string;
  imageUrl?: string;
  likes: string[];
  commentsCount: number;
  createdAt: string;
}

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
};

const FeedPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "trending">("all");
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [newStory, setNewStory] = useState<Story | null>(null);
  const userId = localStorage.getItem('userId') || '';
  const userInitials = userId.substring(0, 2).toUpperCase();

  // Rate limits
  const postRateLimit = useRateLimit({ maxCalls: 5, windowMs: 3600000, message: "Max 5 publications par heure." });
  const likeRateLimit = useRateLimit({ maxCalls: 100, windowMs: 60000, message: "Vous aimez trop vite !" });
  const commentRateLimit = useRateLimit({ maxCalls: 20, windowMs: 60000, message: "Max 20 commentaires par minute." });


  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getFeed();
      
      // Charger les infos des auteurs pour chaque post (sans faire crasher si erreur)
      const postsWithAuthors = await Promise.all(
        data.map(async (post: any) => {
          try {
            const author = await userApi.getProfile(post.authorId);
            return { ...post, author };
          } catch (error) {
            // Si le profil n'existe pas, utiliser des données par défaut (silencieux)
            return {
              ...post,
              author: {
                id: post.authorId,
                username: post.authorId.substring(0, 8),
                fullname: `User ${post.authorId.substring(0, 8)}`
              }
            };
          }
        })
      );
      
      setPosts(postsWithAuthors);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPosts = () => {
    if (activeFilter === "trending") {
      // Trier par nombre de likes (tendances)
      return [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }
    return posts;
  };

  const filteredPosts = getFilteredPosts();

  const handleCreatePost = async () => {
    if (!newPost.trim() || posting) return;
    if (!postRateLimit.check()) return;
    
    setPosting(true);
    try {
      await postApi.createPost({ content: newPost });
      setNewPost("");
      toast({ title: "Publié !", description: "Votre post a été publié avec succès" });
      loadPosts();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de publier", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (id: string) => {
    if (!likeRateLimit.check()) return;
    try {
      const post = posts.find(p => p.id === id);
      if (!post) return;

      const isLiked = post.likes.includes(userId);
      
      if (isLiked) {
        await postApi.unlikePost(id);
        setPosts(posts.map(p =>
          p.id === id ? { ...p, likes: p.likes.filter(uid => uid !== userId) } : p
        ));
      } else {
        await postApi.likePost(id);
        setPosts(posts.map(p =>
          p.id === id ? { ...p, likes: [...p.likes, userId] } : p
        ));
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Action impossible", variant: "destructive" });
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const data = await postApi.getComments(postId);
      // S'assurer que c'est un tableau
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    if (!commentRateLimit.check()) return;

    try {
      await postApi.addComment(postId, commentText);
      setCommentText("");
      loadComments(postId);
      // Mettre à jour le compteur
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ));
      toast({ title: "Commentaire ajouté !" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter le commentaire", variant: "destructive" });
    }
  };

  const toggleComments = (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      loadComments(postId);
    }
  };

  const handleShare = async (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    
    try {
      // Essayer d'utiliser l'API Web Share si disponible (mobile)
      if (navigator.share) {
        await navigator.share({
          title: 'Partager cette publication',
          text: 'Regarde cette publication sur MBolo!',
          url: postUrl
        });
        toast({ title: "✅ Partagé!", description: "Publication partagée avec succès" });
      } else {
        // Sinon, copier le lien dans le presse-papier
        await navigator.clipboard.writeText(postUrl);
        toast({ 
          title: "🔗 Lien copié!", 
          description: "Le lien a été copié dans le presse-papier" 
        });
      }
    } catch (error) {
      // Si l'utilisateur annule ou erreur
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({ 
          title: "❌ Erreur", 
          description: "Impossible de partager", 
          variant: "destructive" 
        });
      }
    }
  };

  const toggleBookmark = (postId: string) => {
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        toast({ title: "🔖 Retiré des favoris" });
      } else {
        newSet.add(postId);
        toast({ title: "⭐ Ajouté aux favoris" });
      }
      return newSet;
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette publication?")) return;
    
    try {
      // TODO: Implémenter l'API de suppression
      setPosts(posts.filter(p => p.id !== postId));
      toast({ title: "✅ Publication supprimée" });
      setShowMenu(null);
    } catch (error) {
      toast({ title: "❌ Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const handleReportPost = (postId: string) => {
    toast({ title: "📢 Signalement envoyé", description: "Nous examinerons cette publication" });
    setShowMenu(null);
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        {/* ── Stories ── */}
        <StoriesBar
          currentUserId={userId || "me"}
          currentUsername={userInitials || "Moi"}
          currentUserInitials={userInitials || "M"}
          onAddStoryClick={() => setShowStoryCreator(true)}
          externalStory={newStory}
        />

        {/* Story Creator Modal */}
        {showStoryCreator && (
          <StoryCreator
            onClose={() => setShowStoryCreator(false)}
            onStoryCreated={(story) => {
              setNewStory(story);
              setShowStoryCreator(false);
            }}
            currentUserId={userId || "me"}
            currentUsername={userInitials || "Moi"}
            currentUserInitials={userInitials || "M"}
          />
        )}

        {/* ── Filtres ── */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-2 flex gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Pour toi
          </button>
          <button
            onClick={() => setActiveFilter("trending")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeFilter === "trending"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Tendances
          </button>
        </div>

        {/* New post composer */}
        <div className="p-4 border-b bg-card/50">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
              {userInitials}
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
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() || posting}
                  className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 shadow-sm"
                >
                  {posting ? "..." : "Publier"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-8 text-center text-muted-foreground">
            Chargement des posts...
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Aucun post pour le moment. Soyez le premier à publier !
          </div>
        )}

        {/* Posts */}
        {filteredPosts.map((post) => {
          const isLiked = post.likes.includes(userId);
          const authorName = post.author?.fullname || post.author?.username || 'Utilisateur';
          const authorUsername = post.author?.username || post.authorId.substring(0, 8);
          const authorInitials = authorUsername.substring(0, 2).toUpperCase();
          
          return (
            <article key={post.id} className="p-4 border-b hover:bg-card/30 transition-colors cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm shrink-0">
                  {authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-sm text-foreground truncate">{authorName}</span>
                      <span className="text-xs text-muted-foreground truncate">@{authorUsername}</span>
                      <span className="text-xs text-muted-foreground">· {formatTimeAgo(post.createdAt)}</span>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(showMenu === post.id ? null : post.id);
                        }}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {/* Menu dropdown */}
                      {showMenu === post.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-10">
                          {post.authorId === userId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePost(post.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors text-destructive"
                            >
                              🗑️ Supprimer
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReportPost(post.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                          >
                            🚩 Signaler
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground mt-1.5 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center justify-between mt-3 max-w-sm">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-all group ${
                        isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                      }`}
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-destructive/10 transition-colors">
                        <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                      </div>
                      {post.likes.length}
                    </button>
                    <button 
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-all group"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-secondary/10 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      {post.commentsCount}
                    </button>
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-all group"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-secondary/10 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </div>
                    </button>
                    <button 
                      onClick={() => toggleBookmark(post.id)}
                      className={`transition-all group ${
                        savedPosts.has(post.id) 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-accent/20 transition-colors">
                        <Bookmark className={`w-4 h-4 ${savedPosts.has(post.id) ? "fill-current" : ""}`} />
                      </div>
                    </button>
                  </div>

                  {/* Comments section */}
                  {showComments === post.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* Comment input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Ajouter un commentaire..."
                          className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={!commentText.trim()}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                        >
                          Envoyer
                        </button>
                      </div>

                      {/* Comments list */}
                      {comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Aucun commentaire</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                              {comment.authorId?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                              <p className="text-xs font-semibold">@{comment.authorId?.substring(0, 8) || 'user'}</p>
                              <p className="text-sm mt-0.5">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default FeedPage;
