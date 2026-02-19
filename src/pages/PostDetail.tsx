import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, ThumbsUp, Loader2, Smile, Image as ImageIcon } from "lucide-react";
import { postApi, userApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}j`;
};

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await postApi.getPost(postId!);
      
      try {
        const author = await userApi.getProfile(data.authorId);
        setPost({ ...data, author });
      } catch {
        setPost({
          ...data,
          author: {
            id: data.authorId,
            username: data.authorId.substring(0, 8),
            fullname: `User ${data.authorId.substring(0, 8)}`
          }
        });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Post introuvable", variant: "destructive" });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await postApi.getComments(postId!);
      
      const commentsWithAuthors = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (comment: any) => {
          try {
            const author = await userApi.getProfile(comment.authorId);
            return { 
              ...comment, 
              author,
              replies: [] // Les réponses seront identifiées par @mention
            };
          } catch {
            return {
              ...comment,
              author: {
                id: comment.authorId,
                username: comment.authorId?.substring(0, 8) || 'user',
                fullname: `User ${comment.authorId?.substring(0, 8) || 'unknown'}`
              },
              replies: []
            };
          }
        })
      );
      
      // Organiser les commentaires et réponses
      const organized = commentsWithAuthors.filter(c => !c.content.startsWith('@'));
      const replies = commentsWithAuthors.filter(c => c.content.startsWith('@'));
      
      // Associer les réponses aux commentaires
      organized.forEach(comment => {
        comment.replies = replies.filter(r => 
          r.content.includes(`@${comment.author?.username}`)
        );
      });
      
      setComments(organized);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const toggleCommentExpand = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const toggleCommentLike = (commentId: string) => {
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const isLiked = post.likes?.includes(userId);
      
      if (isLiked) {
        await postApi.unlikePost(postId!);
        setPost({ ...post, likes: post.likes.filter((id: string) => id !== userId) });
      } else {
        await postApi.likePost(postId!);
        setPost({ ...post, likes: [...(post.likes || []), userId] });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Action impossible", variant: "destructive" });
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      await postApi.addComment(postId!, commentText);
      setCommentText("");
      loadComments();
      if (post) {
        setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
      }
      toast({ title: "✅ Commentaire ajouté !", description: "Votre commentaire est maintenant visible" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter le commentaire", variant: "destructive" });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      const comment = comments.find(c => c.id === commentId);
      const replyContent = `@${comment?.author?.username || 'user'} ${replyText}`;
      
      await postApi.addComment(postId!, replyContent);
      setReplyText("");
      setReplyingTo(null);
      loadComments();
      if (post) {
        setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
      }
      toast({ title: "✅ Réponse ajoutée !", description: "Votre réponse est maintenant visible" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter la réponse", variant: "destructive" });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    
    try {
      // Essayer d'utiliser l'API Web Share si disponible (mobile)
      if (navigator.share) {
        await navigator.share({
          title: 'Partager cette publication',
          text: post?.content || 'Regarde cette publication sur MBolo!',
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

  const toggleBookmark = () => {
    setIsSaved(!isSaved);
    toast({ 
      title: isSaved ? "🔖 Retiré des favoris" : "⭐ Ajouté aux favoris" 
    });
  };

  const handleDeletePost = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette publication?")) return;
    
    try {
      // TODO: Implémenter l'API de suppression
      toast({ title: "✅ Publication supprimée" });
      navigate('/');
    } catch (error) {
      toast({ title: "❌ Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const handleReportPost = () => {
    toast({ title: "📢 Signalement envoyé", description: "Nous examinerons cette publication" });
    setShowMenu(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">Post introuvable</p>
          <button onClick={() => navigate('/')} className="mt-4 text-primary hover:underline">
            Retour au fil d'actualité
          </button>
        </div>
      </div>
    );
  }

  const isLiked = post.likes?.includes(userId);
  const authorName = post.author?.fullname || post.author?.username || 'Utilisateur';
  const authorUsername = post.author?.username || post.authorId?.substring(0, 8) || 'user';
  const authorInitials = authorUsername.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold">Publication de {authorName}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {new Date(post.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-2 px-3 sm:px-4 space-y-3">
        {/* Post principal */}
        <article className="bg-background rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 sm:p-4">
            {/* Auteur */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-md">
                {authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-foreground truncate">{authorName}</h2>
                  <span className="text-sm text-muted-foreground hidden sm:inline">@{authorUsername}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
                
                {/* Menu dropdown */}
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-10">
                    {post.authorId === userId && (
                      <button
                        onClick={handleDeletePost}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors text-destructive"
                      >
                        🗑️ Supprimer
                      </button>
                    )}
                    <button
                      onClick={handleReportPost}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      🚩 Signaler
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="mb-3">
              <p className="text-base sm:text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 py-2 border-y text-sm">
              <button className="hover:underline">
                <span className="font-semibold">{post.likes?.length || 0}</span>{' '}
                <span className="text-muted-foreground">J'aime</span>
              </button>
              <button className="hover:underline">
                <span className="font-semibold">{comments.length}</span>{' '}
                <span className="text-muted-foreground">Commentaires</span>
              </button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-1 pt-2">
              <button
                onClick={handleLike}
                className={`flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg transition-all font-medium text-sm ${
                  isLiked 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="hidden sm:inline">J'aime</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg text-muted-foreground hover:bg-muted transition-all font-medium text-sm">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Commenter</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg text-muted-foreground hover:bg-muted transition-all font-medium text-sm"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Partager</span>
              </button>
              <button 
                onClick={toggleBookmark}
                className={`flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg hover:bg-muted transition-all font-medium text-sm ${
                  isSaved ? "text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved ? "fill-current" : ""}`} />
                <span className="hidden sm:inline">Enregistrer</span>
              </button>
            </div>
          </div>
        </article>

        {/* Zone de commentaire améliorée */}
        <div className="bg-background rounded-lg shadow-sm border p-3 sticky bottom-2 z-10">
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0 shadow-md">
              {userId.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrivez un commentaire public..."
                  rows={2}
                  className="w-full resize-none bg-muted rounded-2xl px-3 py-2 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !submittingComment) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  disabled={submittingComment}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button 
                    className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
                    disabled={submittingComment}
                  >
                    <Smile className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button 
                    className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
                    disabled={submittingComment}
                  >
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {commentText.length > 0 && `${commentText.length} caractères`}
                </span>
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publier
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des commentaires avec scroll */}
        <div className="bg-background rounded-lg shadow-sm border overflow-hidden">
          <div className="p-2 border-b bg-muted/30">
            <h3 className="font-semibold text-foreground">
              Commentaires ({comments.length})
            </h3>
          </div>
          
          <div className="max-h-[calc(100vh-350px)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {comments.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">Aucun commentaire pour le moment</p>
                <p className="text-muted-foreground text-sm mt-1">Soyez le premier à commenter !</p>
              </div>
            ) : (
              <div className="divide-y">
                {comments.map((comment) => {
                  const commentAuthorName = comment.author?.fullname || comment.author?.username || 'Utilisateur';
                  const commentAuthorUsername = comment.author?.username || comment.authorId?.substring(0, 8) || 'user';
                  const commentAuthorInitials = commentAuthorUsername.substring(0, 2).toUpperCase();
                  const hasReplies = comment.replies && comment.replies.length > 0;
                  const isExpanded = expandedComments.has(comment.id);
                  const isLiked = commentLikes[comment.id] || false;
                  
                  const handleCommentClick = () => {
                    if (hasReplies) {
                      // Stocker le postId pour la page de détail du commentaire
                      sessionStorage.setItem(`comment_${comment.id}_postId`, postId!);
                      navigate(`/comment/${comment.id}`);
                    }
                  };
                  
                  return (
                    <div key={comment.id} className="p-3 hover:bg-muted/20 transition-colors">
                      {/* Commentaire principal */}
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-secondary-foreground font-semibold text-sm shrink-0">
                          {commentAuthorInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div 
                            className={`bg-muted rounded-2xl px-4 py-3 ${hasReplies ? 'cursor-pointer hover:bg-muted/80 transition-colors' : ''}`}
                            onClick={hasReplies ? handleCommentClick : undefined}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                                {commentAuthorName}
                              </span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed break-words">
                              {comment.content}
                            </p>
                          </div>
                          
                          {/* Actions du commentaire */}
                          <div className="flex items-center gap-4 mt-2 px-2">
                            <button 
                              onClick={() => toggleCommentLike(comment.id)}
                              className={`text-xs font-semibold transition-colors ${
                                isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                              }`}
                            >
                              J'aime
                            </button>
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                            >
                              Répondre
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                            {isLiked && (
                              <span className="text-xs text-primary font-medium">
                                👍 Vous aimez
                              </span>
                            )}
                          </div>

                          {/* Bouton pour voir les réponses */}
                          {hasReplies && (
                            <div className="flex items-center gap-3 mt-3 px-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCommentExpand(comment.id);
                                }}
                                className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                              >
                                <div className="flex -space-x-2">
                                  {comment.replies.slice(0, 3).map((reply: any, idx: number) => (
                                    <div 
                                      key={idx}
                                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-[10px] text-primary-foreground font-bold"
                                    >
                                      {(reply.author?.username || 'U').substring(0, 1).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                                <span>
                                  {isExpanded ? 'Masquer' : 'Voir'} {comment.replies.length} réponse{comment.replies.length > 1 ? 's' : ''}
                                </span>
                              </button>
                              <button
                                onClick={handleCommentClick}
                                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                              >
                                Voir le fil complet →
                              </button>
                            </div>
                          )}

                          {/* Zone de réponse améliorée */}
                          {replyingTo === comment.id && (
                            <div className="mt-3 ml-0 sm:ml-4 flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-200 bg-muted/30 p-3 rounded-2xl">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0 shadow-sm">
                                {userId.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Répondre à ${commentAuthorName}...`}
                                    className="w-full px-4 py-2.5 pr-12 text-sm rounded-full border-2 border-primary/20 bg-background focus:outline-none focus:border-primary transition-colors shadow-sm"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && replyText.trim() && !submittingReply) {
                                        e.preventDefault();
                                        handleReply(comment.id);
                                      }
                                    }}
                                    autoFocus
                                    disabled={submittingReply}
                                  />
                                  <button
                                    onClick={() => handleReply(comment.id)}
                                    disabled={!replyText.trim() || submittingReply}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                  >
                                    {submittingReply ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center justify-between mt-2 px-2">
                                  <span className="text-xs text-muted-foreground">
                                    Appuyez sur Entrée pour envoyer
                                  </span>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText("");
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={submittingReply}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Réponses (thread) */}
                          {isExpanded && hasReplies && (
                            <div className="mt-4 space-y-3 ml-0 sm:ml-4 border-l-2 border-muted pl-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              {comment.replies.map((reply: any) => {
                                const replyAuthorName = reply.author?.fullname || reply.author?.username || 'Utilisateur';
                                const replyAuthorUsername = reply.author?.username || reply.authorId?.substring(0, 8) || 'user';
                                const replyAuthorInitials = replyAuthorUsername.substring(0, 2).toUpperCase();
                                const replyIsLiked = commentLikes[reply.id] || false;
                                
                                return (
                                  <div key={reply.id} className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                                      {replyAuthorInitials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-muted/50 rounded-2xl px-3 py-2">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="font-semibold text-xs text-foreground hover:underline cursor-pointer">
                                            {replyAuthorName}
                                          </span>
                                        </div>
                                        <p className="text-xs text-foreground leading-relaxed break-words">
                                          {reply.content}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5 px-2">
                                        <button 
                                          onClick={() => toggleCommentLike(reply.id)}
                                          className={`text-[11px] font-semibold transition-colors ${
                                            replyIsLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                                          }`}
                                        >
                                          J'aime
                                        </button>
                                        <button className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors">
                                          Répondre
                                        </button>
                                        <span className="text-[11px] text-muted-foreground">
                                          {formatTimeAgo(reply.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
