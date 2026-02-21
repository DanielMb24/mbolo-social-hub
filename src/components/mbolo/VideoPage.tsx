import { Heart, MessageCircle, Play, Eye, Share2, Bookmark, Music, TrendingUp, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { videoApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Pour toi", "Tendances", "Musique", "Danse", "Cuisine", "Sport", "Art"];
const formatViews = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const VideoPage = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Pour toi");
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await videoApi.getVideos();
      setVideos(data);
    } catch {
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
        setVideos(videos.map(v => v.id === id ? { ...v, likes: v.likes.filter((uid: string) => uid !== userId) } : v));
      } else {
        await videoApi.likeVideo(id);
        setVideos(videos.map(v => v.id === id ? { ...v, likes: [...(v.likes || []), userId] } : v));
      }
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header with categories */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-lg font-bold text-foreground">Vidéos</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
              <Upload className="w-3.5 h-3.5" />
              Publier
            </button>
          </div>
          <div className="px-4 pb-2 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 min-w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement des vidéos...
          </div>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">Aucune vidéo</p>
            <p className="text-sm">Soyez le premier à partager une vidéo !</p>
          </div>
        )}

        {/* Video grid - TikTok-inspired */}
        {!loading && videos.length > 0 && (
          <div className={`p-2 gap-2 ${isMobile ? "space-y-2" : "grid grid-cols-2 lg:grid-cols-3"}`}>
            {videos.map((video) => {
              const isLiked = video.likes?.includes(userId);
              return (
                <div key={video.id} className="rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow group">
                  <div className="relative aspect-[9/14] sm:aspect-[9/12] bg-gradient-to-br from-foreground/5 via-primary/5 to-secondary/5 flex items-center justify-center cursor-pointer">
                    <button className="w-14 h-14 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center text-background hover:bg-foreground/70 transition-all group-hover:scale-110 duration-200">
                      <Play className="w-6 h-6 ml-0.5" />
                    </button>

                    {/* Bottom overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/70 to-transparent">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-secondary/30 flex items-center justify-center text-background font-bold text-[10px]">
                          {video.userId?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <span className="text-background text-xs font-semibold">@{video.userId?.substring(0, 8) || 'user'}</span>
                      </div>
                      <p className="text-background text-sm font-medium leading-tight truncate">{video.title}</p>
                      {video.description && (
                        <p className="text-background/70 text-xs mt-0.5 truncate">{video.description}</p>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-foreground/50 backdrop-blur-sm text-background text-[10px] px-2 py-0.5 rounded-full font-medium">
                      <Eye className="w-3 h-3" />
                      {formatViews(video.views || 0)}
                    </div>

                    {/* Side actions - TikTok style */}
                    <div className={`absolute right-2 ${isMobile ? "bottom-20" : "bottom-24"} flex flex-col items-center gap-3`}>
                      <button onClick={(e) => { e.stopPropagation(); toggleLike(video.id); }} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center ${isLiked ? "bg-destructive/80" : "bg-foreground/30"}`}>
                          <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-background" : "text-background"}`} />
                        </div>
                        <span className="text-background text-[10px] font-semibold mt-0.5">{formatViews(video.likes?.length || 0)}</span>
                      </button>
                      <button className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-background" />
                        </div>
                        <span className="text-background text-[10px] font-semibold mt-0.5">0</span>
                      </button>
                      <button className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center">
                          <Share2 className="w-5 h-5 text-background" />
                        </div>
                      </button>
                    </div>
                  </div>
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
