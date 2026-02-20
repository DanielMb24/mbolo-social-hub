import { X, Phone, VideoIcon, Bell, BellOff, Search, Image as ImageIcon, File, Volume2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { userApi, type UserProfile } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface ChatProfileSidebarProps {
  userId: string;
  onClose: () => void;
}

export const ChatProfileSidebar = ({ userId, onClose }: ChatProfileSidebarProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await userApi.getProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-80 border-l bg-card flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const displayName = profile?.fullname || profile?.username || 'Utilisateur';
  const username = profile?.username || userId.substring(0, 8);
  const avatar = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Informations</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-6 flex flex-col items-center text-center border-b">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-2xl mb-3">
            {avatar}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">{displayName}</h2>
          <p className="text-sm text-muted-foreground">@{username}</p>
          
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b">
          <div className="grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-xs text-foreground">Audio</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <VideoIcon className="w-5 h-5" />
              </div>
              <span className="text-xs text-foreground">Vidéo</span>
            </button>
            <button 
              onClick={() => navigate(`/profile/${userId}`)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-xs text-foreground">Profil</span>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 space-y-1 border-b">
          <button
            onClick={() => setMuted(!muted)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            {muted ? (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Bell className="w-5 h-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {muted ? 'Réactiver les notifications' : 'Désactiver les notifications'}
              </p>
            </div>
          </button>
        </div>

        {/* Media Section */}
        <div className="p-4 border-b">
          <h4 className="text-sm font-semibold text-foreground mb-3">Fichiers partagés</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Photos</p>
                <p className="text-xs text-muted-foreground">0 fichiers</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <File className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Fichiers</p>
                <p className="text-xs text-muted-foreground">0 fichiers</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Audio</p>
                <p className="text-xs text-muted-foreground">0 fichiers</p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4">
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 transition-colors text-left text-destructive">
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-medium">Supprimer la conversation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
