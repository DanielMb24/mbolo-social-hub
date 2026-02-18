import { Settings, LogOut, Camera, MapPin, Calendar, Edit2 } from "lucide-react";

interface ProfilePageProps {
  onLogout: () => void;
}

const ProfilePage = ({ onLogout }: ProfilePageProps) => {
  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Cover */}
      <div className="h-32 bg-gradient-to-r from-primary to-secondary relative">
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            U
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="p-2 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-14 px-4">
        <h2 className="text-xl font-bold text-foreground">Utilisateur MBolo</h2>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Libreville, Gabon</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Rejoint en 2025</span>
        </div>
        <p className="text-sm text-foreground mt-3">
          Passionné de tech et de culture gabonaise 🇬🇦 | Développeur | MBolo early adopter
        </p>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 py-4 border-y">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">127</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">1.2k</p>
            <p className="text-xs text-muted-foreground">Abonnés</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">340</p>
            <p className="text-xs text-muted-foreground">Abonnements</p>
          </div>
        </div>

        {/* Recent posts placeholder */}
        <div className="mt-6">
          <h3 className="font-semibold text-foreground mb-3">Mes publications</h3>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-card" />
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="mt-8 w-full py-3 rounded-lg border border-destructive text-destructive font-medium text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
