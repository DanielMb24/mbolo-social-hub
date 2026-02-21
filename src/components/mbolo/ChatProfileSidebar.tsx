import { X, Phone, VideoIcon, Bell, BellOff, Search, Image as ImageIcon, File, Volume2, Trash2, Lock, Palette, SmilePlus, AtSign, Pin } from "lucide-react";
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    info: true, customize: true, media: true, privacy: true
  });
  const navigate = useNavigate();

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await userApi.getProfile(userId);
      setProfile(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="w-[340px] border-l bg-card flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.fullname || profile?.username || 'Utilisateur';
  const username = profile?.username || userId.substring(0, 8);
  const avatar = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="w-[340px] border-l bg-card flex flex-col h-full overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-foreground text-sm">Informations</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile */}
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-2xl mb-3">
            {avatar}
          </div>
          <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">En ligne il y a 2 h</p>
          
          <div className="mt-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Chiffré de bout en bout
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-6 mt-4">
            <button className="flex flex-col items-center gap-1.5 group">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <Phone className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">Profil</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 group">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <BellOff className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">Sourdine</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 group">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <Search className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">Rechercher</span>
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="px-2 space-y-0.5">
          {/* Info section */}
          <div>
            <button onClick={() => toggleSection('info')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm font-semibold text-foreground">Informations sur la discussion</span>
              <span className={`text-muted-foreground transition-transform ${expandedSections.info ? 'rotate-0' : '-rotate-90'}`}>▾</span>
            </button>
            {expandedSections.info && (
              <div className="ml-1 space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  <Pin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Voir les messages épinglés</span>
                </button>
              </div>
            )}
          </div>

          {/* Customize section */}
          <div>
            <button onClick={() => toggleSection('customize')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm font-semibold text-foreground">Personnaliser la discussion</span>
              <span className={`text-muted-foreground transition-transform ${expandedSections.customize ? 'rotate-0' : '-rotate-90'}`}>▾</span>
            </button>
            {expandedSections.customize && (
              <div className="ml-1 space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <span className="text-sm text-foreground">Modifier le thème</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  <SmilePlus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Modifier l'emoji</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  <AtSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Modifier les pseudos</span>
                </button>
              </div>
            )}
          </div>

          {/* Media section */}
          <div>
            <button onClick={() => toggleSection('media')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm font-semibold text-foreground">Fichiers et contenus multimédias</span>
              <span className={`text-muted-foreground transition-transform ${expandedSections.media ? 'rotate-0' : '-rotate-90'}`}>▾</span>
            </button>
            {expandedSections.media && (
              <div className="ml-1 space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Contenu multimédia</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  <File className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Fichiers</span>
                </button>
              </div>
            )}
          </div>

          {/* Privacy section */}
          <div>
            <button onClick={() => toggleSection('privacy')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
              <span className="text-sm font-semibold text-foreground">Confidentialité et assistance</span>
              <span className={`text-muted-foreground transition-transform ${expandedSections.privacy ? 'rotate-0' : '-rotate-90'}`}>▾</span>
            </button>
            {expandedSections.privacy && (
              <div className="ml-1 space-y-0.5">
                <button onClick={() => setMuted(!muted)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  {muted ? <Bell className="w-4 h-4 text-muted-foreground" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-sm text-foreground">{muted ? 'Réactiver' : 'Mettre en sourdine'}</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Messages éphémères</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="px-2 py-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors text-left text-destructive">
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Supprimer la conversation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
