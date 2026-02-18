import { useState } from "react";
import { Eye, EyeOff, MessageCircle, ArrowRight, Users, Video, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

interface AuthPageProps {
  onLogin: () => void;
}

const FEATURES = [
  { icon: MessageCircle, title: "Messagerie", desc: "Chat en temps réel avec tes proches" },
  { icon: Users, title: "Réseau Social", desc: "Partage et connecte-toi avec ta communauté" },
  { icon: Video, title: "Vidéos courtes", desc: "Crée et découvre du contenu viral" },
  { icon: Shield, title: "Sécurisé", desc: "Tes données restent privées et protégées" },
];

const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left panel - Hero (desktop) / Top hero (mobile) */}
      <div className="relative lg:w-1/2 lg:min-h-screen overflow-hidden">
        <img src={heroBg} alt="MBolo" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/70" />
        <div className="relative z-10 flex flex-col justify-center h-full p-8 lg:p-16 min-h-[280px] lg:min-h-screen">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-accent-foreground" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-primary-foreground tracking-tight">MBolo</h1>
          </div>
          <p className="text-xl lg:text-2xl text-primary-foreground/90 font-medium mb-2">
            Connecte. Partage. Inspire.
          </p>
          <p className="text-primary-foreground/60 text-sm lg:text-base max-w-md mb-8 hidden lg:block">
            La super-app sociale qui réunit messagerie, réseau social et vidéos courtes en une seule plateforme.
          </p>

          {/* Feature cards - desktop only */}
          <div className="hidden lg:grid grid-cols-2 gap-3 max-w-lg">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <f.icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">{f.title}</p>
                  <p className="text-xs text-primary-foreground/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 -mt-6 lg:mt-0 bg-background rounded-t-3xl lg:rounded-none relative z-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-foreground mb-1">
            {isLogin ? "Bon retour ! 👋" : "Rejoins MBolo 🚀"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isLogin ? "Connecte-toi pour retrouver ta communauté" : "Crée ton compte en quelques secondes"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Nom complet</label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+241 XX XX XX XX"
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-secondary hover:underline">Mot de passe oublié ?</button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/25"
            >
              {isLogin ? "Se connecter" : "Créer mon compte"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-sm text-muted-foreground">
              {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-secondary font-semibold hover:underline"
            >
              {isLogin ? "Inscris-toi" : "Connecte-toi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
