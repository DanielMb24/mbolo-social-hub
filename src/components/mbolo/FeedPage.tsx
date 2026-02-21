import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Smile, Bookmark, TrendingUp, ThumbsUp, Laugh, Angry, Frown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { postApi, userApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import StoriesBar from "./StoriesBar";
import StoryCreator from "./StoryCreator";
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

const REACTION_EMOJIS = [
  { emoji: '👍', label: "J'aime", icon: ThumbsUp },
  { emoji: '❤️', label: 'Adore' },
  { emoji: '😂', label: 'Haha', icon: Laugh },
  { emoji: '😮', label: 'Waouh' },
  { emoji: '😢', label: 'Triste', icon: Frown },
  { emoji: '😡', label: 'Grrr', icon: Angry },
];

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} h`;
  if (diffDays < 7) return `${diffDays} j`;
  return past.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [postReactions, setPostReactions] = useState<Record<string, { emoji: string; count: number }[]>>({});
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userId = localStorage.getItem('userId') || '';
  const userInitials = userId.substring(0, 2).toUpperCase();

  const postRateLimit = useRateLimit({ maxCalls: 5, windowMs: 3600000, message: "Max 5 publications par heure." });
  const likeRateLimit = useRateLimit({ maxCalls: 100, windowMs: 60000, message: "Vous aimez trop vite !" });
  const commentRateLimit = useRateLimit({ maxCalls: 20, windowMs: 60000, message: "Max 20 commentaires par minute." });

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getFeed();
      const postsWithAuthors = await Promise.all(
        data.map(async (post: any) => {
          try {
            const author = await userApi.getProfile(post.authorId);
            return { ...post, author };
          } catch {
            return { ...post, author: { id: post.authorId, username: post.authorId.substring(0, 8), fullname: `User ${post.authorId.substring(0, 8)}` } };
          }
        })
      );
      setPosts(postsWithAuthors);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = activeFilter === "trending"
    ? [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    : posts;

  const handleCreatePost = async () => {
    if (!newPost.trim() || posting) return;
    if (!postRateLimit.check()) return;
    setPosting(true);
    try {
      await postApi.createPost({ content: newPost });
      setNewPost("");
      toast({ title: "Publié !", description: "Votre post a été publié" });
      loadPosts();
    } catch {
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
        setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes.filter(uid => uid !== userId) } : p));
      } else {
        await postApi.likePost(id);
        setPosts(posts.map(p => p.id === id ? { ...p, likes: [...p.likes, userId] } : p));
      }
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleReaction = (postId: string, emoji: string) => {
    setPostReactions(prev => {
      const existing = prev[postId] || [];
      const found = existing.find(r => r.emoji === emoji);
      if (found) {
        return { ...prev, [postId]: existing.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
      }
      return { ...prev, [postId]: [...existing, { emoji, count: 1 }] };
    });
    toggleLike(postId);
    setShowReactionPicker(null);
  };

  const handleLongPressStart = (postId: string) => {
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactionPicker(postId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
      reactionTimeoutRef.current = null;
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const data = await postApi.getComments(postId);
      setComments(Array.isArray(data) ? data : []);
    } catch {
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
      setPosts(posts.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleShare = async (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Partager', text: 'Regarde cette publication sur MBolo!', url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast({ title: "🔗 Lien copié!" });
      }
    } catch {}
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[680px]">
        {/* Stories */}
        <StoriesBar
          currentUserId={userId || "me"}
          currentUsername={userInitials || "Moi"}
          currentUserInitials={userInitials || "M"}
          onAddStoryClick={() => setShowStoryCreator(true)}
          externalStory={newStory}
        />

        {showStoryCreator && (
          <StoryCreator
            onClose={() => setShowStoryCreator(false)}
            onStoryCreated={(story) => { setNewStory(story); setShowStoryCreator(false); }}
            currentUserId={userId || "me"}
            currentUsername={userInitials || "Moi"}
            currentUserInitials={userInitials || "M"}
          />
        )}

        {/* Post Composer - Facebook style */}
        <div className="mx-2 sm:mx-0 mt-3 bg-card rounded-xl border shadow-sm">
          <div className="p-3 flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
              {userInitials}
            </div>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={`Quoi de neuf, ${userInitials} ?`}
              rows={1}
              className="w-full resize-none bg-muted rounded-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              onFocus={(e) => { e.currentTarget.rows = 3; e.currentTarget.classList.remove('rounded-full'); e.currentTarget.classList.add('rounded-xl'); }}
              onBlur={(e) => { if (!e.currentTarget.value) { e.currentTarget.rows = 1; e.currentTarget.classList.add('rounded-full'); e.currentTarget.classList.remove('rounded-xl'); } }}
            />
          </div>
          <div className="border-t flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-0.5">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors text-sm">
                <Image className="w-5 h-5 text-success" />
                <span className="hidden sm:inline text-xs font-medium">Photo</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors text-sm">
                <Smile className="w-5 h-5 text-warning" />
                <span className="hidden sm:inline text-xs font-medium">Humeur</span>
              </button>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={!newPost.trim() || posting}
              className="px-5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40"
            >
              {posting ? "..." : "Publier"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 px-2 sm:px-0 mt-3 mb-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Pour toi
          </button>
          <button
            onClick={() => setActiveFilter("trending")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeFilter === "trending" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Tendances
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement...
          </div>
        )}

        {/* Empty */}
        {!loading && posts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-lg font-semibold mb-1">Aucun post</p>
            <p className="text-sm">Soyez le premier à publier !</p>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-3 px-2 sm:px-0 pb-4">
          {filteredPosts.map((post) => {
            const isLiked = post.likes.includes(userId);
            const authorName = post.author?.fullname || post.author?.username || 'Utilisateur';
            const authorUsername = post.author?.username || post.authorId.substring(0, 8);
            const authorInitials = authorUsername.substring(0, 2).toUpperCase();
            const reactions = postReactions[post.id] || [];

            return (
              <article key={post.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Post Header */}
                <div className="flex items-center gap-3 p-3 pb-2">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-sm shrink-0">
                    {authorInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-foreground">{authorName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt)} · 🌐</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === post.id ? null : post.id); }}
                      className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {showMenu === post.id && (
                      <div className="absolute right-0 mt-1 w-52 bg-card border rounded-xl shadow-xl z-20 py-1">
                        <button onClick={(e) => { e.stopPropagation(); setSavedPosts(prev => { const s = new Set(prev); s.has(post.id) ? s.delete(post.id) : s.add(post.id); return s; }); setShowMenu(null); }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <Bookmark className="w-4 h-4" /> {savedPosts.has(post.id) ? 'Retirer des favoris' : 'Enregistrer'}
                        </button>
                        {post.authorId === userId && (
                          <button onClick={(e) => { e.stopPropagation(); setPosts(posts.filter(p => p.id !== post.id)); setShowMenu(null); }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors text-destructive flex items-center gap-2"
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                        <button onClick={() => { setShowMenu(null); toast({ title: "📢 Signalement envoyé" }); }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          🚩 Signaler
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-3 pb-2 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Reaction counters */}
                {(post.likes.length > 0 || reactions.length > 0) && (
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {reactions.length > 0 ? (
                        <span className="flex items-center gap-0.5">
                          {reactions.slice(0, 3).map((r, i) => (
                            <span key={i} className="text-base">{r.emoji}</span>
                          ))}
                          <span className="ml-1">{post.likes.length}</span>
                        </span>
                      ) : isLiked ? (
                        <span className="flex items-center gap-1">
                          <span className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center">
                            <ThumbsUp className="w-3 h-3 text-primary-foreground" />
                          </span>
                          <span>Vous{post.likes.length > 1 ? ` et ${post.likes.length - 1} autres` : ''}</span>
                        </span>
                      ) : post.likes.length > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center">
                            <ThumbsUp className="w-3 h-3 text-primary-foreground" />
                          </span>
                          {post.likes.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {post.commentsCount > 0 && <span>{post.commentsCount} commentaire{post.commentsCount > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                )}

                {/* Action buttons - Facebook style */}
                <div className="border-t mx-3" />
                <div className="flex items-center px-1 py-0.5 relative">
                  {/* Reaction Picker */}
                  {showReactionPicker === post.id && (
                    <div className="absolute bottom-full left-2 mb-1 bg-card border rounded-full shadow-xl px-2 py-1.5 flex items-center gap-0.5 z-30 animate-fade-in">
                      {REACTION_EMOJIS.map(r => (
                        <button
                          key={r.emoji}
                          onClick={(e) => { e.stopPropagation(); handleReaction(post.id, r.emoji); }}
                          className="w-10 h-10 rounded-full hover:bg-muted transition-all hover:scale-125 flex items-center justify-center text-2xl"
                          title={r.label}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                    onMouseDown={() => handleLongPressStart(post.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={() => { handleLongPressEnd(); setShowReactionPicker(null); }}
                    onTouchStart={() => handleLongPressStart(post.id)}
                    onTouchEnd={handleLongPressEnd}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isLiked ? "text-primary" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                    J'aime
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowComments(showComments === post.id ? null : post.id); if (showComments !== post.id) loadComments(post.id); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Commenter
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(post.id); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    Partager
                  </button>
                </div>

                {/* Comments */}
                {showComments === post.id && (
                  <div className="border-t px-3 py-3 space-y-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                        {userInitials}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Écrire un commentaire..."
                          className="flex-1 px-3 py-2 text-sm rounded-full bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                          onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                        />
                      </div>
                    </div>
                    {comments.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-1">Aucun commentaire</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                            {c.authorId?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="bg-muted rounded-2xl px-3 py-2">
                              <p className="text-xs font-bold">{c.authorId?.substring(0, 8) || 'user'}</p>
                              <p className="text-sm">{c.content}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 ml-3">
                              <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">J'aime</button>
                              <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">Répondre</button>
                              <span className="text-[11px] text-muted-foreground">1 min</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
