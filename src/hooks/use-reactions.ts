import { useState, useCallback } from 'react';
import { postApi } from '@/lib/api';
import { toast } from 'sonner';

export const useReactions = (postId: string, initialLikes: string[] = []) => {
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [isLiking, setIsLiking] = useState(false);
  const userId = localStorage.getItem('userId') || '';
  const isLiked = likes.includes(userId);

  const toggleLike = useCallback(async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    
    // Optimistic update
    setLikes(prev => 
      wasLiked 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );

    try {
      if (wasLiked) {
        await postApi.unlikePost(postId);
      } else {
        await postApi.likePost(postId);
      }
    } catch (error) {
      // Revert on error
      setLikes(prev => 
        wasLiked 
          ? [...prev, userId]
          : prev.filter(id => id !== userId)
      );
      toast.error('Erreur lors de la réaction');
    } finally {
      setIsLiking(false);
    }
  }, [postId, userId, isLiked, isLiking]);

  return {
    likes,
    isLiked,
    isLiking,
    toggleLike,
    likesCount: likes.length
  };
};
