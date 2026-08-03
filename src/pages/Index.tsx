import { lazy, Suspense, useState, useEffect } from "react";
import {
  MessageCircle, Users, Video, Home, User, Search, Bell,
  Menu, X, LogOut, WifiOff, Compass, Sparkles, ShieldCheck
} from "lucide-react";
import AuthPage from "@/components/mbolo/AuthPage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { authApi, notificationApi, userApi, type UserProfile } from "@/lib/api";
import { getDisplayUsername } from "@/lib/format-utils";
import { useNavigate } from "react-router-dom";

const FeedPage = lazy(() => import("@/components/mbolo/FeedPage"));
const ChatPage = lazy(() => import("@/components/mbolo/ChatPage"));
const VideoPage = lazy(() => import("@/components/mbolo/VideoPage"));
const ProfilePage = lazy(() => import("@/components/mbolo/ProfilePage"));
const PeoplePage = lazy(() => import("@/components/mbolo/PeoplePage"));
const ExplorePage = lazy(() => import("@/components/mbolo/ExplorePage"));
const SocialHubPage = lazy(() => import("@/components/mbolo/SocialHubPage"));
const AdminPage = lazy(() => import("@/components/mbolo/AdminPage"));
const StoryManager = lazy(() => import("@/components/mbolo/StoryManager"));
const TrendingSidebar = lazy(() => import("@/components/mbolo/TrendingSidebar"));
const NotificationPanel = lazy(() => import("@/components/mbolo/NotificationPanel"));
const GlobalSearch = lazy(() => import("@/components/mbolo/GlobalSearch"));

type Tab = "feed" | "chat" | "videos" | "people" | "profile" | "explore" | "stories" | "communities" | "admin";

const NAV_ITEMS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "feed", icon: Home, label: "Accueil" },
  { id: "explore", icon: Compass, label: "Explorer" },
  { id: "communities", icon: Users, label: "Communautés" },
  { id: "stories", icon: Sparkles, label: "Stories" },
  { id: "chat", icon: MessageCircle, label: "Messenger" },
  { id: "videos", icon: Video, label: "Vidéos" },
  { id: "people", icon: Users, label: "Amis" },
  { id: "profile", icon: User, label: "Profil" },
];

const getRolesFromToken = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token) return [];
  try {
    const payload = token.split(".")[1] || "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized));
    return Array.isArray(parsed.roles) ? parsed.roles.map((role: string) => role.toUpperCase()) : [];
  } catch {
    return [];
  }
};

const LoadingPanel = () => (
  <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
    Chargement...
  </div>
);

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const roles = getRolesFromToken();
  const canAccessAdmin = roles.includes("ADMIN") || roles.includes("MODERATOR");
  const navItems = canAccessAdmin ? [...NAV_ITEMS, { id: "admin" as Tab, icon: ShieldCheck, label: "Admin" }] : NAV_ITEMS;

  useEffect(() => {
    if (isAuthenticated) loadCurrentUser();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    const refreshUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        if (active) setUnreadCount(count);
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    refreshUnreadCount();
    const handleVisibility = () => {
      if (!document.hidden) refreshUnreadCount();
    };
    window.addEventListener("focus", refreshUnreadCount);
    window.addEventListener("mbolo:notifications-changed", refreshUnreadCount);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = window.setInterval(refreshUnreadCount, 10_000);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshUnreadCount);
      window.removeEventListener("mbolo:notifications-changed", refreshUnreadCount);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  const loadCurrentUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const profile = await userApi.getProfile(userId);
          setCurrentUser(profile);
        } catch {
          setCurrentUser({ 
            id: userId, 
            username: getDisplayUsername(undefined, userId), 
            email: '', 
            createdAt: new Date().toISOString() 
          });
        }
      }
    } catch (error) {
      console.warn("Impossible de valider l'utilisateur courant", error);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const userInitials = currentUser?.username?.substring(0, 2).toUpperCase() || 'U';
  const username = currentUser?.username || 'Utilisateur';
  const currentUserId = currentUser?.id || localStorage.getItem('userId') || "me";

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (isMobile) setMobileMenuOpen(false);
  };

  const handleSearchNavigate = (result: { targetTab?: Tab; targetId?: string; type: string }) => {
    if (result.targetTab === "profile" && result.targetId) {
      navigate(`/profile/${result.targetId}`);
      return;
    }

    if (result.type === "post" && result.targetId) {
      navigate(`/post/${result.targetId}`);
      return;
    }

    if (result.targetTab) {
      setActiveTab(result.targetTab);
    }
  };

  // Header nav items for Facebook-style top bar
  const headerNavItems = navItems.filter(n => ['feed', 'explore', 'communities', 'stories', 'videos', 'people', 'chat', 'admin'].includes(n.id));

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
      <header className="flex items-center justify-between px-2 h-12 border-b bg-card shrink-0 z-40">
        {/* Left: Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-muted">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isMobile && <span className="text-lg font-bold text-primary">MBolo</span>}
        </div>

        {/* Center: Navigation tabs */}
        {!isMobile ? (
          <div className="flex-1 flex items-center justify-center max-w-lg mx-4">
            {headerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`relative flex-1 flex items-center justify-center py-2 ${
                    isActive ? "text-primary" : "text-muted-foreground hover:bg-muted rounded-lg"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary" />}
                  {item.id === 'chat' && unreadCount > 0 && (
                    <span className="absolute top-0 right-1/4 min-w-[16px] h-[16px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {headerNavItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`p-1.5 rounded-lg relative ${
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.id === 'chat' && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-destructive text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { setShowSearch(true); setShowNotifications(false); }}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
          >
            <Search className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(n => !n)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <Suspense fallback={null}>
                <NotificationPanel
                  onClose={() => setShowNotifications(false)}
                  onUnreadChange={setUnreadCount}
                />
              </Suspense>
            )}
          </div>
          {!isMobile && (
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                activeTab === 'profile' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
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
        {!isMobile && (activeTab === 'feed' || activeTab === 'explore' || activeTab === 'communities') && (
          <aside className="w-[240px] border-r overflow-y-auto p-2 hidden xl:block shrink-0">
            <div className="space-y-0.5">
              <button onClick={() => handleTabChange('profile')} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted text-left">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {userInitials}
                </div>
                <span className="text-sm font-medium">{currentUser?.fullname || username}</span>
              </button>
              {[
                { icon: Users, label: 'Amis', tab: 'people' as Tab },
                { icon: Video, label: 'Vidéos', tab: 'videos' as Tab },
                { icon: Compass, label: 'Explorer', tab: 'explore' as Tab },
                { icon: Users, label: 'Communautés', tab: 'communities' as Tab },
                { icon: MessageCircle, label: 'Messenger', tab: 'chat' as Tab },
                ...(canAccessAdmin ? [{ icon: ShieldCheck, label: 'Admin', tab: 'admin' as Tab }] : []),
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => handleTabChange(item.tab)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted text-left"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <Suspense fallback={<LoadingPanel />}>
            {activeTab === "feed" && <FeedPage />}
            {activeTab === "explore" && <ExplorePage />}
            {activeTab === "communities" && <SocialHubPage />}
            {activeTab === "stories" && (
              <StoryManager
                currentUserId={currentUserId}
                currentUsername={username}
                currentUserInitials={userInitials}
              />
            )}
            {activeTab === "people" && <PeoplePage />}
            {activeTab === "chat" && <ChatPage />}
            {activeTab === "videos" && <VideoPage />}
            {activeTab === "profile" && <ProfilePage onLogout={handleLogout} />}
            {activeTab === "admin" && <AdminPage />}
          </Suspense>
        </main>

        {/* Right Sidebar */}
        {!isMobile && (activeTab === 'feed' || activeTab === 'explore' || activeTab === 'communities') && (
          <div className="w-[280px] border-l overflow-y-auto p-3 hidden lg:block shrink-0">
            <Suspense fallback={null}>
              <TrendingSidebar />
            </Suspense>
          </div>
        )}
      </div>

      {/* Global Search Overlay */}
      {showSearch && (
        <Suspense fallback={null}>
          <GlobalSearch
            onClose={() => setShowSearch(false)}
            onNavigate={handleSearchNavigate}
          />
        </Suspense>
      )}

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
              {navItems.map((item) => {
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
