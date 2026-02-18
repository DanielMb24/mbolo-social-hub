import { Heart, MessageCircle, Play, Eye } from "lucide-react";
import { useState } from "react";

const MOCK_VIDEOS = [
  { id: "1", author: "Danseur241", avatar: "D2", title: "Danse traditionnelle 🔥", views: 12400, likes: 890, comments: 45, liked: false },
  { id: "2", author: "CuisineGabon", avatar: "CG", title: "Recette Nyembwe authentique", views: 8900, likes: 430, comments: 67, liked: true },
  { id: "3", author: "MusiqueLibre", avatar: "ML", title: "Session acoustique au bord de mer 🎵", views: 5600, likes: 320, comments: 23, liked: false },
  { id: "4", author: "VlogGabon", avatar: "VG", title: "24h à Port-Gentil", views: 21000, likes: 1500, comments: 89, liked: false },
];

const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const VideoPage = () => {
  const [videos, setVideos] = useState(MOCK_VIDEOS);

  const toggleLike = (id: string) => {
    setVideos(videos.map(v =>
      v.id === id ? { ...v, liked: !v.liked, likes: v.liked ? v.likes - 1 : v.likes + 1 } : v
    ));
  };

  return (
    <div className="max-w-lg mx-auto pb-4">
      <div className="px-4 py-3">
        <h2 className="text-lg font-bold text-foreground">Tendances</h2>
      </div>
      <div className="space-y-4 px-4">
        {videos.map((video) => (
          <div key={video.id} className="rounded-xl overflow-hidden bg-card animate-fade-in">
            {/* Video placeholder */}
            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <button className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground hover:bg-primary transition-colors">
                <Play className="w-6 h-6 ml-0.5" />
              </button>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-foreground/70 text-background text-xs px-2 py-0.5 rounded">
                <Eye className="w-3 h-3" />
                {formatViews(video.views)}
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs shrink-0">
                  {video.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-tight">{video.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{video.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 mt-3 pl-12">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPage;
