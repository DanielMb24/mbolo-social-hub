import { useState, useEffect } from "react";
import {
  MessageCircle, Users, Video, Home, User, Search, Bell,
  Menu, X, LogOut, WifiOff
} from "lucide-react";
import FeedPage from "@/components/mbolo/FeedPage";
import ChatPage from "@/components/mbolo/ChatPage";
import VideoPage from "@/components/mbolo/VideoPage";
import ProfilePage from "@/components/mbolo/ProfilePage";
import PeoplePage from "@/components/mbolo/PeoplePage";
import TrendingSidebar from "@/components/mbolo/TrendingSidebar";
import AuthPage from "@/components/mbolo/AuthPage";
import NotificationPanel from "@/components/mbolo/NotificationPanel";
import GlobalSearch from "@/components/mbolo/GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { userApi } from "@/lib/api";

type Tab = "feed" | "chat" | "videos" | "people" | "profile";

const NAV_ITEMS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "feed", icon: Home, label: "Fil d'actualité" },
  { id: "people", icon: Users, label: "Personnes" },
  { id: "chat", icon: MessageCircle, label: "Messages" },
  { id: "videos", icon: Video, label: "Vidéos" },
  { id: "profile", icon: User, label: "Mon Profil" },
];

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount] = useState(3); // Demo: 3 unread
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isAuthenticated) {
      loadCurrentUser();
    }
  }, [isAuthenticated]);

  const loadCurrentUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const profile = await userApi.getProfile(userId);
          setCurrentUser(profile);
        } catch (error) {
          // Profil n'existe pas encore, créer un profil par défaut
          setCurrentUser({
            id: userId,
            username: userId.substring(0, 8),
            email: '',
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const userInitials = currentUser?.username?.substring(0, 2).toUpperCase() || 'U';
  const username = currentUser?.username || 'Utilisateur';

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (isMobile) setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-[72px]"
          } h-full border-r bg-card flex flex-col transition-all duration-300 shrink-0`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-bold text-sm">
              {userInitials}
            </div>
            {sidebarOpen && (
              <span className="text-xl font-extrabold text-primary tracking-tight">MBolo</span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t p-3 space-y-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Menu className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Réduire</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline banner */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground text-xs py-1.5 px-4">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Pas de connexion internet – Mode hors-ligne</span>
          </div>
        )}

        {/* Top header */}
        <header className="flex items-center justify-between px-3 h-12 border-b bg-card shrink-0 z-40">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            )}
            {isMobile && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-extrabold text-primary">MBolo</span>
              </div>
            )}
            {!isMobile && (
              <h2 className="text-lg font-bold text-foreground">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h2>
            )}
          </div>

          {/* Desktop tabs in header */}
          {isMobile && (
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`p-2 rounded-lg transition-colors relative ${
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => { setShowSearch(true); setShowNotifications(false); }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(n => !n); }}
                className="p-2 rounded-lg hover:bg-muted transition-colors relative"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 flex">
          <div className="flex-1 overflow-y-auto">
            {activeTab === "feed" && <FeedPage />}
            {activeTab === "people" && <PeoplePage />}
            {activeTab === "chat" && <ChatPage />}
            {activeTab === "videos" && <VideoPage />}
            {activeTab === "profile" && <ProfilePage onLogout={handleLogout} />}
          </div>
          
          {/* Sidebar - Only on desktop and feed page */}
          {!isMobile && activeTab === "feed" && (
            <div className="w-80 border-l overflow-y-auto p-4">
              <TrendingSidebar />
            </div>
          )}
        </main>
      </div>

      {/* Global Search Overlay */}
      {showSearch && (
        <GlobalSearch onClose={() => setShowSearch(false)} />
      )}

      {/* Mobile menu overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 bg-card h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-4 h-16 border-b">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-extrabold text-primary">MBolo</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* User info */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {userInitials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{username}</p>
                  <p className="text-xs text-muted-foreground">@{username}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-3 px-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t p-3">
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
