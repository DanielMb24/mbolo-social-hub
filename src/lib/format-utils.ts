// Utilitaires de formatage partagés

export const formatTimeAgo = (date: string): string => {
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

export const formatViews = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name.substring(0, 2).toUpperCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getDisplayUsername = (username?: string, userId?: string): string => {
  if (username && username !== userId) return username;
  if (userId) return `user_${userId.substring(0, 6)}`;
  return 'utilisateur';
};
