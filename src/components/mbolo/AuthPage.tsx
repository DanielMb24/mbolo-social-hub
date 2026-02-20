import { useState } from "react";
import { Eye, EyeOff, MessageCircle, ArrowRight, Users, Shield, Heart, TrendingUp, Zap, Mail, Lock, User } from "lucide-react";
import { authApi, userApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { GoogleLoginButton } from "./GoogleLoginButton";

interface AuthPageProps {
  onLogin: () => void;
}

type ViewMode = "login" | "register";

const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (viewMode === "login") {
        const response = await authApi.login({ username, password });
        if (!response.accessToken || !response.userId) throw new Error('Réponse invalide');
        
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('userId', response.userId);
        toast({ title: "✅ Connexion réussie !", description: `Bienvenue ${username}` });
        onLogin();
      } else if (viewMode === "register") {
        const response = await authApi.register({ username, email, password });
        if (!response.accessToken || !response.userId) throw new Error('Réponse invalide');
        
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('userId', response.userId);
        
        try {
          await userApi.updateProfile(response.userId, {
            username, email, fullname: username, bio: 'Nouveau membre de MBolo 🇬🇦'
          });
        } catch (e) { console.log('Profile creation skipped'); }
        
        toast({ title: "🎉 Inscription réussie !", description: "Bienvenue sur MBolo !" });
        onLogin();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erreur d'authentification";
      toast({ title: "❌ Erreur", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-background via-background to-muted">
      {/* Left panel - Illustration (visible on all screens) */}
      <div className="w-full lg:w-1/2 relative overflow-hidden py-8 lg:py-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-8 lg:p-16 text-primary-foreground min-h-[300px] lg:min-h-screen">
          <div className="mb-8 lg:mb-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 lg:w-16 h-12 lg:h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                <MessageCircle className="w-7 lg:w-9 h-7 lg:h-9 text-white" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight">MBolo</h1>
            </div>
            <p className="text-lg lg:text-2xl font-semibold text-white/90">
              Le réseau social du Gabon 🇬🇦
            </p>
          </div>

          {/* Illustration SVG - Responsive */}
          <div className="relative w-full max-w-sm lg:max-w-lg">
            <svg viewBox="0 0 500 400" className="w-full h-auto drop-shadow-2xl">
              <g>
                <rect x="150" y="50" width="200" height="300" rx="20" fill="white" opacity="0.95"/>
                <rect x="160" y="60" width="180" height="280" rx="15" fill="#f8f9fa"/>
                
                <g className="animate-float">
                  <rect x="170" y="80" width="160" height="60" rx="10" fill="white"/>
                  <circle cx="185" cy="95" r="8" fill="#3b82f6"/>
                  <rect x="200" y="88" width="80" height="6" rx="3" fill="#e5e7eb"/>
                  <rect x="200" y="98" width="120" height="4" rx="2" fill="#f3f4f6"/>
                  <rect x="200" y="105" width="100" height="4" rx="2" fill="#f3f4f6"/>
                  
                  <g transform="translate(170, 120)">
                    <circle cx="10" cy="10" r="8" fill="#ef4444" opacity="0.2"/>
                    <path d="M10 6 L10 14 M6 10 L14 10" stroke="#ef4444" strokeWidth="2" fill="none"/>
                  </g>
                  <g transform="translate(200, 120)">
                    <circle cx="10" cy="10" r="8" fill="#3b82f6" opacity="0.2"/>
                    <circle cx="10" cy="10" r="4" fill="#3b82f6"/>
                  </g>
                  <g transform="translate(230, 120)">
                    <circle cx="10" cy="10" r="8" fill="#10b981" opacity="0.2"/>
                    <path d="M6 10 L10 14 L14 6" stroke="#10b981" strokeWidth="2" fill="none"/>
                  </g>
                </g>

                <g className="animate-float-delay">
                  <rect x="170" y="160" width="160" height="60" rx="10" fill="white"/>
                  <circle cx="185" cy="175" r="8" fill="#8b5cf6"/>
                  <rect x="200" y="168" width="90" height="6" rx="3" fill="#e5e7eb"/>
                  <rect x="200" y="178" width="130" height="4" rx="2" fill="#f3f4f6"/>
                  <rect x="200" y="185" width="110" height="4" rx="2" fill="#f3f4f6"/>
                </g>

                <g className="animate-float">
                  <rect x="170" y="240" width="160" height="60" rx="10" fill="white"/>
                  <circle cx="185" cy="255" r="8" fill="#f59e0b"/>
                  <rect x="200" y="248" width="70" height="6" rx="3" fill="#e5e7eb"/>
                  <rect x="200" y="258" width="120" height="4" rx="2" fill="#f3f4f6"/>
                  <rect x="200" y="265" width="90" height="4" rx="2" fill="#f3f4f6"/>
                </g>
              </g>

              <g className="animate-bounce-slow">
                <circle cx="80" cy="100" r="25" fill="white" opacity="0.9"/>
                <path d="M80 90 L80 110 M70 100 L90 100" stroke="#ef4444" strokeWidth="3" fill="none"/>
              </g>
              <g className="animate-bounce-slow delay-500">
                <circle cx="420" cy="150" r="25" fill="white" opacity="0.9"/>
                <circle cx="420" cy="150" r="12" fill="#3b82f6"/>
              </g>
              <g className="animate-bounce-slow delay-1000">
                <circle cx="100" cy="300" r="25" fill="white" opacity="0.9"/>
                <path d="M95 300 L100 305 L105 295" stroke="#10b981" strokeWidth="3" fill="none"/>
              </g>
            </svg>
          </div>

          {/* Features - Hidden on mobile */}
          <div className="hidden lg:grid mt-12 grid-cols-3 gap-6 w-full max-w-lg">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">Communauté</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">Connexions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">Tendances</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {viewMode === "login" && "Bon retour ! 👋"}
                {viewMode === "register" && "Rejoins-nous ! 🚀"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {viewMode === "login" && "Connecte-toi pour retrouver ta communauté"}
                {viewMode === "register" && "Crée ton compte en quelques secondes"}
              </p>
            </div>

            {/* Login Form */}
            {viewMode === "login" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom d'utilisateur <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mot de passe <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Se souvenir de moi</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">Ou continuer avec</span>
                  </div>
                </div>

                <GoogleLoginButton onSuccess={onLogin} />

                <div className="mt-6 text-center">
                  <span className="text-sm text-muted-foreground">Pas encore de compte ? </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("register")}
                    className="text-sm text-primary font-bold hover:underline"
                  >
                    Inscris-toi gratuitement
                  </button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {viewMode === "register" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@mbolo.ga"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom d'utilisateur <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mot de passe <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">Ou continuer avec</span>
                  </div>
                </div>

                <GoogleLoginButton onSuccess={onLogin} />

                <div className="mt-6 text-center">
                  <span className="text-sm text-muted-foreground">Déjà un compte ? </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("login")}
                    className="text-sm text-primary font-bold hover:underline"
                  >
                    Connecte-toi
                  </button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  En créant un compte, tu acceptes nos{" "}
                  <button className="text-primary hover:underline">Conditions d'utilisation</button>
                  {" "}et notre{" "}
                  <button className="text-primary hover:underline">Politique de confidentialité</button>
                </p>
              </form>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Rapide</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Communauté</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>

      {/* Dialog de réinitialisation de mot de passe */}
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

export default AuthPage;
