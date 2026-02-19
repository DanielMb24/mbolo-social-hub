import { Heart, MessageCircle, Play, Eye, Share2, Bookmark, Music, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { videoApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Pour toi", "Tendances", "Musique", "Danse", "Cuisine", "Sport", "Art"];

const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const VideoPage = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Pour toi");
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await videoApi.getVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (id: string) => {
    try {
      const video = videos.find(v => v.id === id);
      if (!video) return;

      const isLiked = video.likes?.includes(userId);
      
      if (isLiked) {
        await videoApi.unlikeVideo(id);
        setVideos(videos.map(v =>
          v.id === id ? { ...v, likes: v.likes.filter((uid: string) => uid !== userId) } : v
        ));
      } else {
        await videoApi.likeVideo(id);
        setVideos(videos.map(v =>
          v.id === id ? { ...v, likes: [...(v.likes || []), userId] } : v
        ));
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Action impossible", variant: "destructive" });
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        {/* Categories */}
        <div className="px-4 py-2.5 border-b overflow-x-auto sticky top-0 bg-background z-10">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center text-muted-foreground">
            Chargement des vidéos...
          </div>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Play className="w-12 h-12 mx-auto mb-3" />
            <p>Aucune vidéo pour le moment</p>
          </div>
        )}

        {/* Video grid */}
        {!loading && videos.length > 0 && (
          <div className={`p-4 gap-4 ${isMobile ? "space-y-4" : "grid grid-cols-2"}`}>
            {videos.map((video) => {
              const isLiked = video.likes?.includes(userId);
              return (
                <div key={video.id} className="rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow group">
                  {/* Video placeholder */}
                  <div className="relative aspect-[9/12] sm:aspect-video bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10 flex items-center justify-center cursor-pointer">
                    <button className="w-16 h-16 rounded-full bg-foreground/70 flex items-center justify-center text-background hover:bg-foreground/80 transition-all group-hover:scale-110 duration-200">
                      <Play className="w-7 h-7 ml-1" />
                    </button>

                    {/* Overlay info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/60 to-transparent">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-[10px]">
                          {video.userId?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <span className="text-background text-xs font-semibold">@{video.userId?.substring(0, 8) || 'user'}</span>
                      </div>
                      <p className="text-background text-sm font-medium leading-tight truncate">{video.title}</p>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-foreground/50 text-background text-[10px] px-2 py-0.5 rounded-full font-medium">
                      <Eye className="w-3 h-3" />
                      {formatViews(video.views || 0)}
                    </div>

                    {/* Side actions - TikTok style on mobile */}
                    {isMobile && (
                      <div className="absolute right-2 bottom-16 flex flex-col items-center gap-4">
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(video.id); }} className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-foreground/30 flex items-center justify-center">
                            <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-destructive" : "text-background"}`} />
                          </div>
                          <span className="text-background text-[10px] font-medium mt-0.5">{formatViews(video.likes?.length || 0)}</span>
                        </button>
                        <button className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-foreground/30 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-background" />
                          </div>
                          <span className="text-background text-[10px] font-medium mt-0.5">0</span>
                        </button>
                        <button className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-foreground/30 flex items-center justify-center">
                            <Bookmark className="w-5 h-5 text-background" />
                          </div>
                        </button>
                        <button className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-foreground/30 flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-background" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Desktop info bar */}
                  {!isMobile && (
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{video.description || video.title}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleLike(video.id)}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                            {formatViews(video.likes?.length || 0)}
                          </button>
                          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            0
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="text-muted-foreground hover:text-accent-foreground transition-colors">
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
