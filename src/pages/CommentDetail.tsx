import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, ThumbsUp, Send, Loader2, Smile, Image as ImageIcon, MoreHorizontal } from "lucide-react";
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

const CommentDetail = () => {
  const { commentId } = useParams<{ commentId: string }>();
  const navigate = useNavigate();
  const [comment, setComment] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submittingReply, setSubmittingReply] = useState(false);
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (commentId) {
      loadCommentThread();
    }
  }, [commentId]);

  const loadCommentThread = async () => {
    try {
      // Charger tous les commentaires du post pour trouver le commentaire et ses réponses
      // On doit d'abord trouver le postId du commentaire
      // Pour simplifier, on va chercher dans tous les commentaires
      
      // Note: Cette approche nécessite de connaître le postId
      // Pour l'instant, on va stocker le postId dans l'URL ou le state
      const postId = sessionStorage.getItem(`comment_${commentId}_postId`);
      
      if (!postId) {
        toast({ title: "Erreur", description: "Impossible de charger le fil", variant: "destructive" });
        navigate(-1);
        return;
      }

      const allComments = await postApi.getComments(postId);
      
      // Trouver le commentaire principal
      const mainComment = allComments.find((c: any) => c.id === commentId);
      
      if (!mainComment) {
        toast({ title: "Erreur", description: "Commentaire introuvable", variant: "destructive" });
        navigate(-1);
        return;
      }

      // Charger l'auteur du commentaire principal
      try {
        const author = await userApi.getProfile(mainComment.authorId);
        setComment({ ...mainComment, author });
      } catch {
        setComment({
          ...mainComment,
          author: {
            id: mainComment.authorId,
            username: mainComment.authorId?.substring(0, 8) || 'user',
            fullname: `User ${mainComment.authorId?.substring(0, 8) || 'unknown'}`
          }
        });
      }

      // Trouver toutes les réponses (commentaires qui mentionnent l'auteur)
      const commentReplies = allComments.filter((c: any) => 
        c.id !== commentId && 
        c.content.includes(`@${mainComment.author?.username || mainComment.authorId?.substring(0, 8)}`)
      );

      // Charger les auteurs des réponses
      const repliesWithAuthors = await Promise.all(
        commentReplies.map(async (reply: any) => {
          try {
            const author = await userApi.getProfile(reply.authorId);
            return { ...reply, author };
          } catch {
            return {
              ...reply,
              author: {
                id: reply.authorId,
                username: reply.authorId?.substring(0, 8) || 'user',
                fullname: `User ${reply.authorId?.substring(0, 8) || 'unknown'}`
              }
            };
          }
        })
      );

      setReplies(repliesWithAuthors);
    } catch (error) {
      console.error('Error loading comment thread:', error);
      toast({ title: "Erreur", description: "Impossible de charger le fil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentLike = (id: string) => {
    setCommentLikes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleReply = async () => {
    if (!replyText.trim() || !comment || submittingReply) return;

    try {
      setSubmittingReply(true);
      const postId = sessionStorage.getItem(`comment_${commentId}_postId`);
      if (!postId) return;

      const replyContent = `@${comment.author?.username || 'user'} ${replyText}`;
      
      await postApi.addComment(postId, replyContent);
      setReplyText("");
      loadCommentThread();
      toast({ title: "✅ Réponse ajoutée !", description: "Votre réponse est maintenant visible" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter la réponse", variant: "destructive" });
    } finally {
      setSubmittingReply(false);
    }
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

  if (!comment) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Commentaire introuvable</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-primary hover:underline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const commentAuthorName = comment.author?.fullname || comment.author?.username || 'Utilisateur';
  const commentAuthorUsername = comment.author?.username || comment.authorId?.substring(0, 8) || 'user';
  const commentAuthorInitials = commentAuthorUsername.substring(0, 2).toUpperCase();
  const isMainCommentLiked = commentLikes[comment.id] || false;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold">Fil de commentaire</h1>
            <p className="text-xs text-muted-foreground">
              {replies.length} réponse{replies.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-2 px-3 sm:px-4 space-y-3">
        {/* Commentaire principal */}
        <div className="bg-background rounded-lg shadow-sm border p-3 sm:p-4">
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-secondary-foreground font-bold text-xs shrink-0 shadow-md">
              {commentAuthorInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground">{commentAuthorName}</span>
                  <span className="text-sm text-muted-foreground">@{commentAuthorUsername}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <p className="text-base text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Actions améliorées */}
              <div className="flex items-center gap-4 pt-3 border-t">
                <button 
                  onClick={() => toggleCommentLike(comment.id)}
                  className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all font-medium text-sm ${
                    isMainCommentLiked 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isMainCommentLiked ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline">J'aime</span>
                </button>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="hidden sm:inline">Publié</span> {formatTimeAgo(comment.createdAt)}
                </span>
                <button className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zone de réponse */}
        <div className="bg-background rounded-lg shadow-sm border p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
              {userId.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Répondre à ${commentAuthorName}...`}
                  className="w-full px-4 py-3 pr-12 text-sm rounded-full border-2 border-primary/20 bg-background focus:outline-none focus:border-primary transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && replyText.trim()) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des réponses */}
        <div className="bg-background rounded-lg shadow-sm border overflow-hidden">
          <div className="p-2 border-b bg-muted/30">
            <h3 className="font-semibold text-foreground">
              Réponses ({replies.length})
            </h3>
          </div>
          
          <div className="max-h-[calc(100vh-450px)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {replies.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground font-medium">Aucune réponse pour le moment</p>
                <p className="text-muted-foreground text-sm mt-1">Soyez le premier à répondre !</p>
              </div>
            ) : (
              <div className="divide-y">
                {replies.map((reply) => {
                  const replyAuthorName = reply.author?.fullname || reply.author?.username || 'Utilisateur';
                  const replyAuthorUsername = reply.author?.username || reply.authorId?.substring(0, 8) || 'user';
                  const replyAuthorInitials = replyAuthorUsername.substring(0, 2).toUpperCase();
                  const isReplyLiked = commentLikes[reply.id] || false;
                  
                  return (
                    <div key={reply.id} className="p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                          {replyAuthorInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                                {replyAuthorName}
                              </span>
                              <span className="text-xs text-muted-foreground">@{replyAuthorUsername}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed break-words">
                              {reply.content}
                            </p>
                          </div>
                          
                          {/* Actions de la réponse */}
                          <div className="flex items-center gap-4 mt-2 px-2">
                            <button 
                              onClick={() => toggleCommentLike(reply.id)}
                              className={`text-xs font-semibold transition-colors ${
                                isReplyLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                              }`}
                            >
                              J'aime
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(reply.createdAt)}
                            </span>
                            {isReplyLiked && (
                              <span className="text-xs text-primary font-medium">
                                👍 Vous aimez
                              </span>
                            )}
                          </div>
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

export default CommentDetail;
