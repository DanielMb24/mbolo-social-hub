import { useState } from "react";
import { Eye, EyeOff, MessageCircle, ArrowRight, Users, Shield, Heart, TrendingUp, Zap, Mail, Lock, User, CheckCircle, Sparkles } from "lucide-react";
import { authApi, userApi } from "@/lib/api";
import { toast } from "sonner";
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
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('username', username);
        toast.success(`Bienvenue ${username}`, { description: 'Connexion réussie' });
        onLogin();
      } else if (viewMode === "register") {
        const response = await authApi.register({ username, email, password });
        if (!response.accessToken || !response.userId) throw new Error('Réponse invalide');
        
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('username', username);
        
        try {
          await userApi.updateProfile(response.userId, {
            username, email, fullname: username, bio: 'Nouveau membre de MBolo'
          });
        } catch (e) { console.log('Profile creation skipped'); }
        
        toast.success('Bienvenue sur MBolo', { description: 'Inscription réussie' });
        onLogin();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erreur d'authentification";
      toast.error('Erreur', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left panel - Illustration */}
      <div className="w-full lg:w-1/2 relative overflow-hidden py-6 sm:py-8 lg:py-0 bg-gradient-to-br from-accent/10 via-background to-muted">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-6 sm:p-8 lg:p-16 text-foreground min-h-[250px] lg:min-h-screen">
          <div className="mb-6 sm:mb-8 lg:mb-12 text-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-2xl bg-accent/10 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 lg:w-9 lg:h-9 text-accent" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight">MBolo</h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl font-medium text-muted-foreground">
              Le réseau social du Gabon
            </p>
          </div>

          {/* Illustration SVG - Responsive */}
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-lg hidden sm:block">
            <svg viewBox="0 0 500 400" className="w-full h-auto drop-shadow-2xl opacity-60">
              <g>
                <rect x="150" y="50" width="200" height="300" rx="20" fill="currentColor" className="text-card" opacity="0.95"/>
                <rect x="160" y="60" width="180" height="280" rx="15" fill="currentColor" className="text-muted"/>
                
                <g className="animate-float">
                  <rect x="170" y="80" width="160" height="60" rx="10" fill="currentColor" className="text-card"/>
                  <circle cx="185" cy="95" r="8" fill="currentColor" className="text-accent"/>
                  <rect x="200" y="88" width="80" height="6" rx="3" fill="currentColor" className="text-border"/>
                  <rect x="200" y="98" width="120" height="4" rx="2" fill="currentColor" className="text-muted"/>
                  <rect x="200" y="105" width="100" height="4" rx="2" fill="currentColor" className="text-muted"/>
                </g>

                <g className="animate-float-delay">
                  <rect x="170" y="160" width="160" height="60" rx="10" fill="currentColor" className="text-card"/>
                  <circle cx="185" cy="175" r="8" fill="currentColor" className="text-accent"/>
                  <rect x="200" y="168" width="90" height="6" rx="3" fill="currentColor" className="text-border"/>
                  <rect x="200" y="178" width="130" height="4" rx="2" fill="currentColor" className="text-muted"/>
                </g>

                <g className="animate-float">
                  <rect x="170" y="240" width="160" height="60" rx="10" fill="currentColor" className="text-card"/>
                  <circle cx="185" cy="255" r="8" fill="currentColor" className="text-accent"/>
                  <rect x="200" y="248" width="70" height="6" rx="3" fill="currentColor" className="text-border"/>
                  <rect x="200" y="258" width="120" height="4" rx="2" fill="currentColor" className="text-muted"/>
                </g>
              </g>
            </svg>
          </div>

          {/* Features */}
          <div className="hidden lg:grid mt-12 grid-cols-3 gap-6 w-full max-w-lg">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium">Communauté</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium">Connexions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium">Tendances</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-16">
        <div className="w-full max-w-md">
          <div className="card-modern p-6 sm:p-8">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                {viewMode === "login" && (
                  <>
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
                    Bon retour
                  </>
                )}
                {viewMode === "register" && (
                  <>
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
                    Rejoins-nous
                  </>
                )}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {viewMode === "login" && "Connecte-toi pour retrouver ta communauté"}
                {viewMode === "register" && "Crée ton compte en quelques secondes"}
              </p>
            </div>

            {/* Login Form */}
            {viewMode === "login" && (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-foreground block mb-1.5 sm:mb-2">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                    Nom d'utilisateur <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5 sm:mb-2">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
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
                      className="input-modern pr-10 sm:pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label className="flex items-center gap-1.5 sm:gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Se souvenir</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-accent hover:underline font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-accent w-full py-2.5 sm:py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      <span className="font-semibold text-sm sm:text-base">Connexion...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-semibold text-sm sm:text-base">Se connecter</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>

                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-card text-muted-foreground">Ou continuer avec</span>
                  </div>
                </div>

                <GoogleLoginButton onSuccess={onLogin} />

                <div className="mt-4 sm:mt-6 text-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Pas encore de compte ? </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("register")}
                    className="text-xs sm:text-sm text-accent font-bold hover:underline"
                  >
                    Inscris-toi gratuitement
                  </button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {viewMode === "register" && (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-foreground block mb-1.5 sm:mb-2">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@mbolo.ga"
                    required
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-foreground block mb-1.5 sm:mb-2">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                    Nom d'utilisateur <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-foreground block mb-1.5 sm:mb-2">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
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
                      className="input-modern pr-10 sm:pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-accent w-full py-2.5 sm:py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      <span className="font-semibold text-sm sm:text-base">Inscription...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-semibold text-sm sm:text-base">Créer mon compte</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>

                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-card text-muted-foreground">Ou continuer avec</span>
                  </div>
                </div>

                <GoogleLoginButton onSuccess={onLogin} />

                <div className="mt-4 sm:mt-6 text-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Déjà un compte ? </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("login")}
                    className="text-xs sm:text-sm text-accent font-bold hover:underline"
                  >
                    Connecte-toi
                  </button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-3 sm:mt-4">
                  En créant un compte, tu acceptes nos{" "}
                  <button className="text-accent hover:underline">Conditions</button>
                  {" "}et notre{" "}
                  <button className="text-accent hover:underline">Politique de confidentialité</button>
                </p>
              </form>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 text-muted-foreground">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs">Sécurisé</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs">Rapide</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
