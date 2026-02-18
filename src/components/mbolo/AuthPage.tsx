import { useState } from "react";
import { Eye, EyeOff, MessageCircle } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

interface AuthPageProps {
  onLogin: () => void;
}

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img src={heroBg} alt="MBolo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/95 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-extrabold text-primary-foreground tracking-tight">MBolo</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">Connecte. Partage. Inspire.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 pb-6 -mt-6 bg-background rounded-t-3xl relative z-10">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          {isLogin ? "Connexion" : "Inscription"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isLogin ? "Heureux de te revoir !" : "Rejoins la communauté MBolo"}
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
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            {isLogin ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-secondary font-medium hover:underline"
          >
            {isLogin ? "Pas de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
