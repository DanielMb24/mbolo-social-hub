export const PostSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl shadow-sm border p-3 sm:p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
        <div className="w-8 h-8 rounded-full bg-muted" />
      </div>

      {/* Content */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <div className="h-8 bg-muted rounded w-20" />
        <div className="h-8 bg-muted rounded w-24" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    </div>
  );
};

export const CommentSkeleton = () => {
  return (
    <div className="p-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1">
          <div className="bg-muted rounded-2xl px-4 py-3">
            <div className="h-3 bg-muted-foreground/20 rounded w-24 mb-2" />
            <div className="h-3 bg-muted-foreground/20 rounded w-full mb-1" />
            <div className="h-3 bg-muted-foreground/20 rounded w-4/5" />
          </div>
          <div className="flex items-center gap-4 mt-2 px-2">
            <div className="h-3 bg-muted rounded w-12" />
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Cover */}
      <div className="h-40 lg:h-56 bg-muted" />
      
      {/* Profile info */}
      <div className="px-4 lg:px-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted border-4 border-background" />
          <div className="flex-1 pb-2 space-y-2">
            <div className="h-6 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>

        <div className="flex items-center gap-6 mt-4">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-28" />
        </div>
      </div>
    </div>
  );
};
