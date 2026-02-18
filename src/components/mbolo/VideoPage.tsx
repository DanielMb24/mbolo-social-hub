import { Heart, MessageCircle, Play, Eye, Share2, Bookmark, Music, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const MOCK_VIDEOS = [
  { id: "1", author: "Danseur241", avatar: "D2", title: "Danse traditionnelle 🔥", desc: "Performance incroyable lors du festival de Libreville", views: 12400, likes: 890, comments: 45, liked: false, saved: false },
  { id: "2", author: "CuisineGabon", avatar: "CG", title: "Recette Nyembwe authentique", desc: "La vraie recette de ma grand-mère, étape par étape", views: 8900, likes: 430, comments: 67, liked: true, saved: true },
  { id: "3", author: "MusiqueLibre", avatar: "ML", title: "Session acoustique au bord de mer 🎵", desc: "Guitare + coucher de soleil = magie", views: 5600, likes: 320, comments: 23, liked: false, saved: false },
  { id: "4", author: "VlogGabon", avatar: "VG", title: "24h à Port-Gentil", desc: "Découverte de la capitale économique", views: 21000, likes: 1500, comments: 89, liked: false, saved: false },
  { id: "5", author: "FitnessLBV", avatar: "FL", title: "Workout au Jardin Botanique 💪", desc: "Routine de sport en plein air", views: 3200, likes: 210, comments: 15, liked: false, saved: false },
  { id: "6", author: "ArtGabon", avatar: "AG", title: "Sculpture sur bois traditionnelle", desc: "L'art ancestral du Gabon", views: 7800, likes: 560, comments: 34, liked: true, saved: false },
];

const CATEGORIES = ["Pour toi", "Tendances", "Musique", "Danse", "Cuisine", "Sport", "Art"];

const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const VideoPage = () => {
  const [videos, setVideos] = useState(MOCK_VIDEOS);
  const [activeCategory, setActiveCategory] = useState("Pour toi");
  const isMobile = useIsMobile();

  const toggleLike = (id: string) => {
    setVideos(videos.map(v =>
      v.id === id ? { ...v, liked: !v.liked, likes: v.liked ? v.likes - 1 : v.likes + 1 } : v
    ));
  };

  const toggleSave = (id: string) => {
    setVideos(videos.map(v =>
      v.id === id ? { ...v, saved: !v.saved } : v
    ));
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

        {/* Video grid */}
        <div className={`p-4 gap-4 ${isMobile ? "space-y-4" : "grid grid-cols-2"}`}>
          {videos.map((video) => (
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
                      {video.avatar}
                    </div>
                    <span className="text-background text-xs font-semibold">{video.author}</span>
                  </div>
                  <p className="text-background text-sm font-medium leading-tight truncate">{video.title}</p>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1 bg-foreground/50 text-background text-[10px] px-2 py-0.5 rounded-full font-medium">
                  <Eye className="w-3 h-3" />
                  {formatViews(video.views)}
                </div>

                {/* Side actions - TikTok style on mobile */}
                {isMobile && (
                  <div className="absolute right-2 bottom-16 flex flex-col items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); toggleLike(video.id); }} className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-foreground/30 flex items-center justify-center">
                        <Heart className={`w-5 h-5 ${video.liked ? "fill-current text-destructive" : "text-background"}`} />
                      </div>
                      <span className="text-background text-[10px] font-medium mt-0.5">{formatViews(video.likes)}</span>
                    </button>
                    <button className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-foreground/30 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-background" />
                      </div>
                      <span className="text-background text-[10px] font-medium mt-0.5">{video.comments}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleSave(video.id); }} className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-foreground/30 flex items-center justify-center">
                        <Bookmark className={`w-5 h-5 ${video.saved ? "fill-current text-accent" : "text-background"}`} />
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
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{video.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(video.id)}
                        className={`flex items-center gap-1 text-sm transition-colors ${
                          video.liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${video.liked ? "fill-current" : ""}`} />
                        {formatViews(video.likes)}
                      </button>
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        {video.comments}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSave(video.id)}
                        className={`transition-colors ${video.saved ? "text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground"}`}
                      >
                        <Bookmark className={`w-4 h-4 ${video.saved ? "fill-current" : ""}`} />
                      </button>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
