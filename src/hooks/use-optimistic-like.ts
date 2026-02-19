import { useState } from "react";
import { postApi } from "@/lib/api";
import { showErrorToast } from "@/lib/toast-helpers";

interface UseOptimisticLikeProps {
  initialLikes: string[];
  postId: string;
  userId: string;
}

export const useOptimisticLike = ({ initialLikes, postId, userId }: UseOptimisticLikeProps) => {
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  const isLiked = likes.includes(userId);

  const toggleLike = async () => {
    if (isLoading) return;

    // Optimistic update
    const previousLikes = [...likes];
    const newLikes = isLiked 
      ? likes.filter(id => id !== userId)
      : [...likes, userId];
    
    setLikes(newLikes);
    setIsLoading(true);

    try {
      if (isLiked) {
        await postApi.unlikePost(postId);
      } else {
        await postApi.likePost(postId);
      }
    } catch (error) {
      // Rollback on error
      setLikes(previousLikes);
      showErrorToast("Action impossible", "Impossible de mettre à jour le like");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    likes,
    isLiked,
    likesCount: likes.length,
    toggleLike,
    isLoading,
  };
};

// Hook similaire pour les commentaires
export const useOptimisticComment = (postId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addComment = async (content: string, onSuccess?: () => void) => {
    if (isSubmitting || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await postApi.addComment(postId, content);
      onSuccess?.();
    } catch (error) {
      showErrorToast("Erreur", "Impossible d'ajouter le commentaire");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    addComment,
    isSubmitting,
  };
};
