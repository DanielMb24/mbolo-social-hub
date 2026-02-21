import { useState, useEffect } from "react";
import {
  MessageCircle, Users, Video, Home, User, Search, Bell,
  Menu, X, LogOut, WifiOff, Compass
} from "lucide-react";
import FeedPage from "@/components/mbolo/FeedPage";
import ChatPage from "@/components/mbolo/ChatPage";
import VideoPage from "@/components/mbolo/VideoPage";
import ProfilePage from "@/components/mbolo/ProfilePage";
import PeoplePage from "@/components/mbolo/PeoplePage";
import ExplorePage from "@/components/mbolo/ExplorePage";
import TrendingSidebar from "@/components/mbolo/TrendingSidebar";
import AuthPage from "@/components/mbolo/AuthPage";
import NotificationPanel from "@/components/mbolo/NotificationPanel";
import GlobalSearch from "@/components/mbolo/GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { userApi } from "@/lib/api";

type Tab = "feed" | "chat" | "videos" | "people" | "profile" | "explore";

const NAV_ITEMS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "feed", icon: Home, label: "Accueil" },
  { id: "explore", icon: Compass, label: "Explorer" },
  { id: "chat", icon: MessageCircle, label: "Messenger" },
  { id: "videos", icon: Video, label: "Vidéos" },
  { id: "people", icon: Users, label: "Amis" },
  { id: "profile", icon: User, label: "Profil" },
];

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount] = useState(3);
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isAuthenticated) loadCurrentUser();
  }, [isAuthenticated]);

  const loadCurrentUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const profile = await userApi.getProfile(userId);
          setCurrentUser(profile);
        } catch {
          setCurrentUser({ id: userId, username: userId.substring(0, 8), email: '', createdAt: new Date().toISOString() });
        }
      }
    } catch {}
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

  // Header nav items for Facebook-style top bar
  const headerNavItems = NAV_ITEMS.filter(n => ['feed', 'explore', 'videos', 'people', 'chat'].includes(n.id));

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground text-xs py-1.5 px-4">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Pas de connexion internet</span>
        </div>
      )}

      {/* ─── Top Header - Facebook style ─── */}
      <header className="flex items-center justify-between px-3 h-14 border-b bg-card shrink-0 z-40 shadow-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          {isMobile ? (
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-1 rounded-lg hover:bg-muted transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          ) : null}
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isMobile && <span className="text-xl font-extrabold text-primary tracking-tight">MBolo</span>}
        </div>

        {/* Center: Navigation tabs (desktop) */}
        {!isMobile && (
          <div className="flex-1 flex items-center justify-center max-w-xl mx-8">
            {headerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`relative flex-1 flex items-center justify-center py-2.5 transition-colors group ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
                  )}
                  {item.id === 'chat' && unreadCount > 0 && (
                    <span className="absolute top-1 right-1/4 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile center tabs */}
        {isMobile && (
          <div className="flex items-center gap-0.5">
            {headerNavItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`p-2 rounded-lg transition-colors relative ${
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { setShowSearch(true); setShowNotifications(false); }}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <Search className="w-4 h-4 text-foreground" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(n => !n)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative"
            >
              <Bell className="w-4 h-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
          </div>
          {!isMobile && (
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                activeTab === 'profile' ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {userInitials}
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Left Sidebar */}
        {!isMobile && (activeTab === 'feed' || activeTab === 'explore') && (
          <aside className="w-[280px] border-r overflow-y-auto p-3 hidden xl:block shrink-0">
            <div className="space-y-1">
              <button onClick={() => handleTabChange('profile')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {userInitials}
                </div>
                <span className="text-sm font-semibold text-foreground">{currentUser?.fullname || username}</span>
              </button>
              {[
                { icon: Users, label: 'Amis', tab: 'people' as Tab },
                { icon: Video, label: 'Vidéos', tab: 'videos' as Tab },
                { icon: Compass, label: 'Explorer', tab: 'explore' as Tab },
                { icon: MessageCircle, label: 'Messenger', tab: 'chat' as Tab },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => handleTabChange(item.tab)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {activeTab === "feed" && <FeedPage />}
          {activeTab === "explore" && <ExplorePage />}
          {activeTab === "people" && <PeoplePage />}
          {activeTab === "chat" && <ChatPage />}
          {activeTab === "videos" && <VideoPage />}
          {activeTab === "profile" && <ProfilePage onLogout={handleLogout} />}
        </main>

        {/* Right Sidebar */}
        {!isMobile && (activeTab === 'feed' || activeTab === 'explore') && (
          <div className="w-[300px] border-l overflow-y-auto p-4 hidden lg:block shrink-0">
            <TrendingSidebar />
          </div>
        )}
      </div>

      {/* Global Search Overlay */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* Mobile Drawer */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[280px] bg-card h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-4 h-14 border-b">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
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
                  <p className="font-semibold text-foreground">{currentUser?.fullname || username}</p>
                  <p className="text-xs text-muted-foreground">@{username}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
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
