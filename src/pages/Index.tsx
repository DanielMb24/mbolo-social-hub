import { useState } from "react";
import { MessageCircle, Users, Video, Home, User, Search, Bell } from "lucide-react";
import FeedPage from "@/components/mbolo/FeedPage";
import ChatPage from "@/components/mbolo/ChatPage";
import VideoPage from "@/components/mbolo/VideoPage";
import ProfilePage from "@/components/mbolo/ProfilePage";
import AuthPage from "@/components/mbolo/AuthPage";

type Tab = "feed" | "chat" | "videos" | "profile";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("feed");

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "feed", icon: Home, label: "Feed" },
    { id: "chat", icon: MessageCircle, label: "Chat" },
    { id: "videos", icon: Video, label: "Vidéos" },
    { id: "profile", icon: User, label: "Profil" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-50">
        <h1 className="text-xl font-bold text-primary">MBolo</h1>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "feed" && <FeedPage />}
        {activeTab === "chat" && <ChatPage />}
        {activeTab === "videos" && <VideoPage />}
        {activeTab === "profile" && <ProfilePage onLogout={() => setIsAuthenticated(false)} />}
      </main>

      {/* Bottom nav */}
      <nav className="flex items-center justify-around border-t bg-background py-2 sticky bottom-0 z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Index;
