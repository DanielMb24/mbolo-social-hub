import { Settings, LogOut, Camera, MapPin, Calendar, Edit2, Grid3x3, Video, Bookmark, Heart, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ProfilePageProps {
  onLogout: () => void;
}

type ProfileTab = "posts" | "videos" | "saved";

const ProfilePage = ({ onLogout }: ProfilePageProps) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const tabs: { id: ProfileTab; icon: React.ElementType; label: string }[] = [
    { id: "posts", icon: Grid3x3, label: "Publications" },
    { id: "videos", icon: Video, label: "Vidéos" },
    { id: "saved", icon: Bookmark, label: "Enregistrés" },
  ];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl pb-8">
        {/* Cover */}
        <div className="h-40 lg:h-56 bg-gradient-to-r from-primary via-primary/80 to-secondary relative">
          <button className="absolute top-3 right-3 p-2 rounded-full bg-foreground/20 text-primary-foreground hover:bg-foreground/30 transition-colors backdrop-blur-sm">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Profile info */}
        <div className="px-4 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-3xl sm:text-4xl font-bold shadow-lg">
                U
              </div>
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-md hover:opacity-90 transition-opacity">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Utilisateur MBolo</h2>
                  <p className="text-sm text-muted-foreground">@user_mbolo</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Edit2 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <p className="text-sm text-foreground leading-relaxed">
              Passionné de tech et de culture gabonaise 🇬🇦 | Développeur | MBolo early adopter ✨
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Libreville, Gabon</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Rejoint en 2025</span>
              <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> mbolo.ga/user</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <span className="text-foreground"><strong className="font-bold">127</strong> <span className="text-muted-foreground">publications</span></span>
            <span className="text-foreground cursor-pointer hover:underline"><strong className="font-bold">1.2k</strong> <span className="text-muted-foreground">abonnés</span></span>
            <span className="text-foreground cursor-pointer hover:underline"><strong className="font-bold">340</strong> <span className="text-muted-foreground">abonnements</span></span>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content grid */}
          <div className="mt-4">
            {activeTab === "posts" && (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-card hover:opacity-80 transition-opacity cursor-pointer relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/30">
                      <div className="flex items-center gap-3 text-background text-sm font-semibold">
                        <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> 42</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "videos" && (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[9/16] sm:aspect-video rounded-lg bg-card hover:opacity-80 transition-opacity cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-accent/10" />
                    <div className="absolute bottom-1 left-1 text-[10px] text-background bg-foreground/50 px-1.5 py-0.5 rounded font-medium">0:30</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "saved" && (
              <div className="py-12 text-center">
                <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Tes contenus enregistrés apparaîtront ici</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="mt-8 w-full py-3 rounded-xl border border-destructive text-destructive font-medium text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
