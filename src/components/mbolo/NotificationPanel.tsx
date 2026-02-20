import { useState, useEffect, useRef } from "react";
import { Bell, Heart, MessageCircle, Film, Check, X } from "lucide-react";

export interface AppNotification {
  id: string;
  type: "message" | "like" | "comment" | "story" | "follow";
  title: string;
  body: string;
  avatar?: string;
  avatarInitials: string;
  read: boolean;
  createdAt: string;
}

const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "message",
    title: "Amara K.",
    body: "T'as vu la nouvelle ? 🔥",
    avatarInitials: "AK",
    read: false,
    createdAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "n2",
    type: "like",
    title: "Brice M. a aimé ton post",
    body: "« Libreville est magnifique... »",
    avatarInitials: "BM",
    read: false,
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "n3",
    type: "comment",
    title: "Cécile N. a commenté",
    body: "Trop vrai ! 🙌",
    avatarInitials: "CN",
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "n4",
    type: "story",
    title: "David O. a publié une story",
    body: "Nouvelle story disponible",
    avatarInitials: "DO",
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "n5",
    type: "follow",
    title: "Fatou B. vous suit maintenant",
    body: "Découvrez son profil",
    avatarInitials: "FB",
    read: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "maintenant";
  if (m < 60) return `${m}min`;
  if (h < 24) return `${h}h`;
  return `${d}j`;
};

const iconForType = (type: AppNotification["type"]) => {
  switch (type) {
    case "message": return <MessageCircle className="w-3.5 h-3.5 text-primary" />;
    case "like": return <Heart className="w-3.5 h-3.5 text-destructive" />;
    case "comment": return <MessageCircle className="w-3.5 h-3.5 text-secondary" />;
    case "story": return <Film className="w-3.5 h-3.5 text-accent-foreground" />;
    default: return <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(DEMO_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Fermer en cliquant hors du panneau
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card border rounded-2xl shadow-2xl z-[200] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline px-2 py-1 rounded"
            >
              Tout lire
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                !notif.read ? "bg-primary/5" : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-xs">
                  {notif.avatarInitials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
                  {iconForType(notif.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${!notif.read ? "font-semibold text-foreground" : "text-foreground"}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                  className="p-1 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t text-center">
          <button className="text-xs text-primary hover:underline">
            Voir toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
};

export { NotificationPanel };
export default NotificationPanel;
