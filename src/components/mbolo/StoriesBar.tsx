import { useState, useEffect, useRef } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { storyApi } from "@/lib/api";

export interface Story {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  avatarInitials: string;
  mediaUrl?: string;
  mediaType: "image" | "video" | "text";
  content?: string;
  backgroundColor?: string;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
  duration?: number; // ms
}

interface StoryGroup {
  userId: string;
  username: string;
  avatarUrl?: string;
  avatarInitials: string;
  stories: Story[];
  allSeen: boolean;
}

// ─────────────────────────── STORY VIEWER ────────────────────────────────────

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStorySeen: (storyId: string) => void;
}

const StoryViewer = ({ groups, initialGroupIndex, onClose, onStorySeen }: StoryViewerProps) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const DURATION = currentStory?.duration || 5000;
  const TICK = 50;

  const goNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
      progressRef.current = 0;
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
      progressRef.current = 0;
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
      progressRef.current = 0;
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setStoryIndex(0);
      setProgress(0);
      progressRef.current = 0;
    }
  };

  useEffect(() => {
    if (currentStory) {
      onStorySeen(currentStory.id);
    }
    setProgress(0);
    progressRef.current = 0;
  }, [storyIndex, groupIndex]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      progressRef.current += (TICK / DURATION) * 100;
      setProgress(progressRef.current);
      if (progressRef.current >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        goNext();
      }
    }, TICK);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, storyIndex, groupIndex, DURATION]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") setPaused(p => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [storyIndex, groupIndex]);

  if (!currentGroup || !currentStory) return null;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    if (m < 1) return "À l'instant";
    if (m < 60) return `Il y a ${m}min`;
    return `Il y a ${h}h`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Story card */}
      <div
        className="relative w-full max-w-sm h-[85vh] rounded-2xl overflow-hidden shadow-2xl select-none"
        style={
          currentStory.mediaType === "text"
            ? { background: currentStory.backgroundColor || "#1a1a2e" }
            : { background: "#000" }
        }
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {currentGroup.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white transition-none"
                style={{
                  width:
                    i < storyIndex
                      ? "100%"
                      : i === storyIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-3 right-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white font-bold text-xs">
              {currentGroup.avatarInitials}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{currentGroup.username}</p>
              <p className="text-white/70 text-xs">{timeAgo(currentStory.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
              className="p-1.5 rounded-full bg-black/30 text-white"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setPaused(p => !p); }}
              className="p-1.5 rounded-full bg-black/30 text-white"
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content */}
        {currentStory.mediaType === "text" && (
          <div className="flex items-center justify-center h-full p-8">
            <p className="text-white text-2xl font-bold text-center leading-relaxed drop-shadow-lg">
              {currentStory.content}
            </p>
          </div>
        )}
        {currentStory.mediaType === "image" && currentStory.mediaUrl && (
          <img
            src={currentStory.mediaUrl}
            alt="story"
            className="w-full h-full object-cover"
            draggable={false}
          />
        )}

        {/* Tap zones */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        />
      </div>

      {/* Prev group */}
      {groupIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {/* Next group */}
      {groupIndex < groups.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

// ─────────────────────────── STORIES BAR ─────────────────────────────────────

interface StoriesBarProps {
  currentUserId?: string;
  currentUsername?: string;
  currentUserInitials?: string;
  onAddStoryClick?: () => void;
  externalStory?: Story | null;
}

const StoriesBar = ({
  currentUserId = "me",
  currentUsername = "Moi",
  currentUserInitials = "M",
  onAddStoryClick,
  externalStory,
}: StoriesBarProps) => {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadStories = async () => {
      const rows = await storyApi.getStories();
      const grouped = new Map<string, StoryGroup>();
      grouped.set(currentUserId, {
        userId: currentUserId,
        username: currentUsername,
        avatarInitials: currentUserInitials,
        allSeen: false,
        stories: [],
      });

      rows.forEach((story) => {
        const group = grouped.get(story.userId) || {
          userId: story.userId,
          username: story.username || story.userId.slice(0, 8),
          avatarUrl: story.avatarUrl,
          avatarInitials: story.avatarInitials || story.userId.slice(0, 2).toUpperCase(),
          stories: [],
          allSeen: true,
        };
        group.stories.push(story);
        group.allSeen = group.stories.every(s => s.seen);
        grouped.set(story.userId, group);
      });

      setGroups(Array.from(grouped.values()));
    };

    loadStories().catch(() => {
      setGroups([{
        userId: currentUserId,
        username: currentUsername,
        avatarInitials: currentUserInitials,
        allSeen: false,
        stories: [],
      }]);
    });
  }, [currentUserId, currentUsername, currentUserInitials]);

  // Inject external story created via StoryCreator
  useEffect(() => {
    if (!externalStory) return;
    setGroups(prev =>
      prev.map(g =>
        g.userId === currentUserId
          ? { ...g, stories: [externalStory, ...g.stories], allSeen: false }
          : g
      )
    );
  }, [externalStory]);

  const openViewer = (index: number) => {
    const group = groups[index];
    if (group.userId === currentUserId && group.stories.length === 0) {
      onAddStoryClick?.();
      return;
    }
    setViewerGroupIndex(index);
    setViewerOpen(true);
  };

  const handleStorySeen = (storyId: string) => {
    storyApi.markSeen(storyId).catch(() => undefined);
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        stories: g.stories.map(s => s.id === storyId ? { ...s, seen: true } : s),
        allSeen: g.stories.every(s => s.id === storyId ? true : s.seen),
      }))
    );
  };

  // Always show "me" slot, plus non-empty groups
  const displayGroups = [
    groups[0] || {
      userId: currentUserId,
      username: currentUsername,
      avatarInitials: currentUserInitials,
      allSeen: false,
      stories: [],
    },
    ...groups.slice(1).filter(g => g.stories.length > 0),
  ];

  return (
    <>
      <div className="border-b bg-card/50">
        <div
          ref={scrollRef}
          className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {displayGroups.map((group) => {
            const realIndex = groups.indexOf(group);
            const isMe = group.userId === currentUserId;
            const hasNoStories = group.stories.length === 0;
            const ringColor = group.allSeen || hasNoStories
              ? "ring-muted"
              : "ring-[hsl(var(--primary))]";

            return (
              <button
                key={group.userId}
                onClick={() => openViewer(realIndex)}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className={`relative w-16 h-16 rounded-full ring-2 ring-offset-2 ring-offset-background ${ringColor} transition-transform group-hover:scale-105`}>
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.username}
                      className="w-full h-full rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {group.avatarInitials}
                    </div>
                  )}
                  {isMe && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                      <Plus className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  {!isMe && !group.allSeen && group.stories.length > 0 && (
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-destructive border-2 border-background" />
                  )}
                </div>
                <span className="text-xs text-foreground/80 font-medium truncate max-w-[64px] text-center leading-tight">
                  {isMe ? "Ma story" : group.username.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {viewerOpen && (
        <StoryViewer
          groups={displayGroups.filter(g => g.stories.length > 0)}
          initialGroupIndex={Math.max(0, displayGroups.filter(g => g.stories.length > 0).findIndex(g => g.userId === displayGroups[viewerGroupIndex]?.userId))}
          onClose={() => setViewerOpen(false)}
          onStorySeen={handleStorySeen}
        />
      )}
    </>
  );
};

export default StoriesBar;
