import { MessageCircle, Share2, MoreHorizontal, Image, Smile, Bookmark, TrendingUp, ThumbsUp, Trash2, Flag, Link2, Globe, X, Video, MapPin } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { postApi, userApi } from "@/lib/api";
import { toast } from "sonner";
import StoriesBar from "./StoriesBar";
import StoryCreator from "./StoryCreator";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { formatTimeAgo, getInitials, getDisplayUsername } from "@/lib/format-utils";
import { REACTION_TYPES } from "@/lib/reaction-constants";
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
  mediaUrls?: string[];
  likes: string[];
  commentsCount: number;
  createdAt: string;
}

// Utilisation des constantes partagées

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
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userId = localStorage.getItem('userId') || '';
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const userInitials = username ? username.substring(0, 2).toUpperCase() : 'U';

  const postRateLimit = useRateLimit({ maxCalls: 5, windowMs: 3600000, message: "Max 5 publications par heure." });
  const likeRateLimit = useRateLimit({ maxCalls: 100, windowMs: 60000, message: "Vous aimez trop vite !" });
  const commentRateLimit = useRateLimit({ maxCalls: 20, windowMs: 60000, message: "Max 20 commentaires par minute." });

  useEffect(() => { 
    loadPosts();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await userApi.getProfile(userId);
      if (profile.username) {
        setUsername(profile.username);
        localStorage.setItem('username', profile.username);
      }
    } catch {
      // Garder le username du localStorage
    }
  };

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
            return { 
              ...post, 
              author: { 
                id: post.authorId, 
                username: getDisplayUsername(undefined, post.authorId), 
                fullname: getDisplayUsername(undefined, post.authorId)
              } 
            };
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

  const handleCreatePost = useCallback(async () => {
    if (!newPost.trim() || posting) return;
    if (!postRateLimit.check()) return;
    setPosting(true);
    try {
      // Pour l'instant, créer le post sans image (le backend ne supporte pas encore multipart/form-data)
      // TODO: Implémenter l'upload d'image séparé quand le backend sera prêt
      await postApi.createPost({ content: newPost });
      
      setNewPost("");
      setPreviewImage(null);
      setSelectedImageFile(null);
      setShowPostComposer(false);
      
      if (selectedImageFile) {
        toast.success("Post publié (image non supportée pour l'instant)");
      } else {
        toast.success("Post publié avec succès");
      }
      
      loadPosts();
    } catch (error) {
      console.error('Post creation error:', error);
      toast.error("Impossible de publier le post");
    } finally {
      setPosting(false);
    }
  }, [newPost, posting, postRateLimit, selectedImageFile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Stocker le fichier pour l'upload
      setSelectedImageFile(file);
      
      // Créer la preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLike = useCallback(async (id: string) => {
    if (!likeRateLimit.check()) return;
    try {
      const post = posts.find(p => p.id === id);
      if (!post) return;
      const isLiked = post.likes.includes(userId);
      
      // Optimistic update
      setPosts(posts.map(p => p.id === id ? { 
        ...p, 
        likes: isLiked ? p.likes.filter(uid => uid !== userId) : [...p.likes, userId] 
      } : p));
      
      if (isLiked) {
        await postApi.unlikePost(id);
      } else {
        await postApi.likePost(id);
      }
    } catch {
      toast.error("Erreur lors de la réaction");
      // Revert on error
      loadPosts();
    }
  }, [posts, userId, likeRateLimit]);

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

  const handleComment = useCallback(async (postId: string) => {
    if (!commentText.trim()) return;
    if (!commentRateLimit.check()) return;
    try {
      await postApi.addComment(postId, commentText);
      setCommentText("");
      loadComments(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    } catch {
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  }, [commentText, posts, commentRateLimit]);

  const handleShare = useCallback(async (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Partager', text: 'Regarde cette publication sur MBolo!', url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Lien copié", { icon: <Link2 className="w-4 h-4" /> });
      }
    } catch (error) {
      // Ignore share errors
      console.log('Share cancelled or failed');
    }
  }, []);

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
            <button
              onClick={() => setShowPostComposer(true)}
              className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-sm"
            >
              Quoi de neuf, {username} ?
            </button>
          </div>
          <div className="border-t flex items-center justify-between px-3 py-2">
            <button
              onClick={() => setShowPostComposer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors text-sm"
            >
              <Image className="w-5 h-5 text-success" />
              <span className="hidden sm:inline text-xs font-medium">Photo/Vidéo</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors text-sm">
              <Smile className="w-5 h-5 text-warning" />
              <span className="hidden sm:inline text-xs font-medium">Humeur</span>
            </button>
          </div>
        </div>

        {/* Post Composer Modal */}
        {showPostComposer && (
          <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-bold text-foreground">Créer une publication</h3>
                <button
                  onClick={() => { setShowPostComposer(false); setNewPost(""); setPreviewImage(null); setSelectedImageFile(null); }}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User info */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {userInitials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{username}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    <Globe className="w-3 h-3" />
                    <span>Public</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder={`Quoi de neuf, ${username} ?`}
                  rows={4}
                  className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
                  autoFocus
                />

                {/* Image Preview */}
                {previewImage && (
                  <div className="relative mt-3 rounded-xl overflow-hidden border">
                    <img src={previewImage} alt="Preview" className="w-full max-h-96 object-cover" />
                    <button
                      onClick={() => { setPreviewImage(null); setSelectedImageFile(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-card/90 backdrop-blur-sm text-xs font-medium">
                      Aperçu de l'image
                    </div>
                  </div>
                )}
              </div>

              {/* Add to post */}
              <div className="px-4 py-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ajouter à votre post</span>
                  <div className="flex items-center gap-1">
                    <input
                      ref={imageUploadRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => imageUploadRef.current?.click()}
                      className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                    >
                      <Image className="w-5 h-5 text-success" />
                    </button>
                    <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                      <Video className="w-5 h-5 text-destructive" />
                    </button>
                    <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                      <Smile className="w-5 h-5 text-warning" />
                    </button>
                    <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                      <MapPin className="w-5 h-5 text-destructive" />
                    </button>
                    <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t">
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() || posting}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {posting ? "Publication..." : "Publier sur MBolo"}
                </button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  En publiant, vous acceptez nos <button className="text-primary hover:underline">Conditions d'utilisation</button>
                </p>
              </div>
            </div>
          </div>
        )}

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
            const authorUsername = getDisplayUsername(post.author?.username, post.authorId);
            const authorInitials = getInitials(authorUsername);
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
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {formatTimeAgo(post.createdAt)} · <Globe className="w-3 h-3" />
                    </span>
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
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSavedPosts(prev => { 
                              const s = new Set(prev); 
                              if (s.has(post.id)) {
                                s.delete(post.id);
                              } else {
                                s.add(post.id);
                              }
                              return s; 
                            }); 
                            setShowMenu(null); 
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <Bookmark className="w-4 h-4" /> {savedPosts.has(post.id) ? 'Retirer des favoris' : 'Enregistrer'}
                        </button>
                        {post.authorId === userId && (
                          <button onClick={(e) => { e.stopPropagation(); setPosts(posts.filter(p => p.id !== post.id)); setShowMenu(null); }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors text-destructive flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </button>
                        )}
                        <button onClick={() => { setShowMenu(null); toast.success("Signalement envoyé"); }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <Flag className="w-4 h-4" /> Signaler
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
<div className="px-3 pb-2 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  
                  {/* Post Images */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mt-3 -mx-3">
                      {post.mediaUrls.length === 1 ? (
                        <img 
                          src={post.mediaUrls[0]} 
                          alt="Post" 
                          className="w-full max-h-[500px] object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={`grid gap-1 ${post.mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                          {post.mediaUrls.slice(0, 4).map((url, idx) => (
                            <img 
                              key={idx}
                              src={url} 
                              alt={`Post ${idx + 1}`} 
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                      {REACTION_TYPES.map(r => {
                        const Icon = r.icon;
                        return (
                          <button
                            key={r.id}
                            onClick={(e) => { e.stopPropagation(); handleReaction(post.id, r.id); }}
                            className="w-10 h-10 rounded-full hover:bg-muted transition-all hover:scale-125 flex items-center justify-center"
                            title={r.label}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        );
                      })}
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
                            {getInitials(c.authorId || 'U')}
                          </div>
                          <div>
                            <div className="bg-muted rounded-2xl px-3 py-2">
                              <p className="text-xs font-bold">{getDisplayUsername(c.author?.username, c.authorId)}</p>
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
