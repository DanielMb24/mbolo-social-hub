import { useState, useEffect, useRef } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play } from "lucide-react";

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

const DEMO_STORY_GROUPS: StoryGroup[] = [
  {
    userId: "me",
    username: "Moi",
    avatarInitials: "M",
    allSeen: false,
    stories: [],
  },
  {
    userId: "u1",
    username: "Amara K.",
    avatarInitials: "AK",
    allSeen: false,
    stories: [
      {
        id: "s1",
        userId: "u1",
        username: "Amara K.",
        avatarInitials: "AK",
        mediaType: "text",
        content: "🎉 Grande nouvelle aujourd'hui !",
        backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        expiresAt: new Date(Date.now() + 82800000).toISOString(),
        seen: false,
        duration: 5000,
      },
      {
        id: "s2",
        userId: "u1",
        username: "Amara K.",
        avatarInitials: "AK",
        mediaType: "text",
        content: "🌟 Gabon c'est beau !",
        backgroundColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        expiresAt: new Date(Date.now() + 84600000).toISOString(),
        seen: false,
        duration: 5000,
      },
    ],
  },
  {
    userId: "u2",
    username: "Brice M.",
    avatarInitials: "BM",
    allSeen: true,
    stories: [
      {
        id: "s3",
        userId: "u2",
        username: "Brice M.",
        avatarInitials: "BM",
        mediaType: "text",
        content: "💪 Motivation du matin !",
        backgroundColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        expiresAt: new Date(Date.now() + 79200000).toISOString(),
        seen: true,
        duration: 5000,
      },
    ],
  },
  {
    userId: "u3",
    username: "Cécile N.",
    avatarInitials: "CN",
    allSeen: false,
    stories: [
      {
        id: "s4",
        userId: "u3",
        username: "Cécile N.",
        avatarInitials: "CN",
        mediaType: "text",
        content: "🍃 Bonne journée à tous !",
        backgroundColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        createdAt: new Date(Date.now() - 900000).toISOString(),
        expiresAt: new Date(Date.now() + 85500000).toISOString(),
        seen: false,
        duration: 5000,
      },
    ],
  },
  {
    userId: "u4",
    username: "David O.",
    avatarInitials: "DO",
    allSeen: false,
    stories: [
      {
        id: "s5",
        userId: "u4",
        username: "David O.",
        avatarInitials: "DO",
        mediaType: "text",
        content: "🏙️ Libreville by night 🌙",
        backgroundColor: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        createdAt: new Date(Date.now() - 5400000).toISOString(),
        expiresAt: new Date(Date.now() + 81000000).toISOString(),
        seen: false,
        duration: 5000,
      },
    ],
  },
];

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

const StoriesBar = () => {
  const [groups, setGroups] = useState<StoryGroup[]>(DEMO_STORY_GROUPS);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openViewer = (index: number) => {
    // Skip "Moi" (index 0) if no stories
    if (index === 0 && groups[0].stories.length === 0) return;
    setViewerGroupIndex(index);
    setViewerOpen(true);
  };

  const handleStorySeen = (storyId: string) => {
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        stories: g.stories.map(s => s.id === storyId ? { ...s, seen: true } : s),
        allSeen: g.stories.every(s => s.id === storyId ? true : s.seen),
      }))
    );
  };

  const nonEmptyGroups = groups.filter((g, i) => i === 0 || g.stories.length > 0);

  return (
    <>
      <div className="border-b bg-card/50">
        <div
          ref={scrollRef}
          className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {nonEmptyGroups.map((group, i) => {
            const realIndex = groups.indexOf(group);
            const isMe = group.userId === "me";
            const ringColor = group.allSeen
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
          groups={nonEmptyGroups.filter(g => g.stories.length > 0)}
          initialGroupIndex={Math.max(0, viewerGroupIndex - 1)}
          onClose={() => setViewerOpen(false)}
          onStorySeen={handleStorySeen}
        />
      )}
    </>
  );
};

export default StoriesBar;
