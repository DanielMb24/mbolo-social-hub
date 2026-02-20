interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: Date;
  size?: 'sm' | 'md' | 'lg';
}

export const OnlineStatus = ({ isOnline, lastSeen, size = 'md' }: OnlineStatusProps) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${sizeClasses[size]} rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground'}`} />
      {!isOnline && lastSeen && (
        <span className="text-xs text-muted-foreground">
          {formatLastSeen(lastSeen)}
        </span>
      )}
      {isOnline && (
        <span className="text-xs text-green-600 dark:text-green-400">
          En ligne
        </span>
      )}
    </div>
  );
};
