import { TrendingUp, Users, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { userApi, postApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Hashtag {
  tag: string;
  count: number;
}

interface SuggestedUser {
  id: string;
  username: string;
  fullname?: string;
  followersCount: number;
}

const TrendingSidebar = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set());
  const currentUserId = localStorage.getItem('userId') || '';

  useEffect(() => {
    loadTrending();
    loadSuggestions();
  }, []);

  const loadTrending = async () => {
    try {
      // Charger tous les posts et extraire les hashtags
      const posts = await postApi.getFeed();
      const hashtagMap = new Map<string, number>();

      posts.forEach((post: any) => {
        const content = post.content || '';
        const matches = content.match(/#[\wÀ-ÿ]+/g);
        if (matches) {
          matches.forEach((tag: string) => {
            const normalized = tag.toLowerCase();
            hashtagMap.set(normalized, (hashtagMap.get(normalized) || 0) + 1);
          });
        }
      });

      // Convertir en tableau et trier par popularité
      const trending = Array.from(hashtagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setHashtags(trending);
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      // Charger des utilisateurs aléatoires
      const allUsers = await userApi.searchUsers("");
      const filtered = allUsers
        .filter(u => u.id !== currentUserId)
        .sort(() => Math.random() - 0.5) // Mélanger
        .slice(0, 3) // Prendre 3 suggestions
        .map(u => ({
          id: u.id,
          username: u.username,
          fullname: u.fullname,
          followersCount: u.followersCount || 0
        }));

      setSuggestedUsers(filtered);

      // Charger les statuts de suivi (avec gestion d'erreur)
      const followingStatuses = await Promise.all(
        filtered.map(async (user) => {
          try {
            const isFollowing = await userApi.isFollowing(user.id);
            return { userId: user.id, isFollowing };
          } catch (error) {
            // Si l'endpoint n'existe pas encore (404), considérer comme non suivi
            return { userId: user.id, isFollowing: false };
          }
        })
      );

      const followingSet = new Set(
        followingStatuses.filter(s => s.isFollowing).map(s => s.userId)
      );
      setFollowingUsers(followingSet);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      // Ne pas afficher d'erreur à l'utilisateur, juste logger
    }
  };

  const toggleFollow = async (userId: string) => {
    if (loadingFollow.has(userId)) return;

    setLoadingFollow(prev => new Set(prev).add(userId));
    const isCurrentlyFollowing = followingUsers.has(userId);

    try {
      if (isCurrentlyFollowing) {
        await userApi.unfollowUser(userId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast({ title: "✅ Désabonné" });
      } else {
        await userApi.followUser(userId);
        setFollowingUsers(prev => new Set(prev).add(userId));
        toast({ title: "✅ Abonné" });
      }
    } catch (error: any) {
      // Si erreur 404, c'est que le backend n'est pas encore rebuild
      if (error?.response?.status === 404) {
        toast({ 
          title: "⚠️ Fonctionnalité en cours de déploiement", 
          description: "Veuillez rebuild le user-service",
          variant: "destructive"
        });
      } else {
        toast({ title: "Erreur", description: "Action impossible", variant: "destructive" });
      }
    } finally {
      setLoadingFollow(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="w-80 space-y-4 sticky top-4">
      {/* Tendances */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tendances au Gabon
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">ACTUALITÉS</p>
        </div>
        <div className="divide-y">
          {hashtags.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucune tendance pour le moment
            </div>
          ) : (
            hashtags.map((item, index) => (
              <button
                key={item.tag}
                className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase mb-0.5">
                      {index === 0 ? 'POLITIQUE' : index === 1 ? 'CULTURE' : index === 2 ? 'LOCAL' : index === 3 ? 'SPORT' : 'ACTUALITÉS'}
                    </p>
                    <p className="font-bold text-foreground">
                      {item.tag}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.count.toLocaleString()} post{item.count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground mt-1" />
                </div>
              </button>
            ))
          )}
          {hashtags.length > 0 && (
            <button className="w-full p-4 text-primary hover:bg-muted/50 transition-colors text-sm font-medium text-left">
              Voir plus
            </button>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Suggestions
          </h3>
        </div>
        <div className="divide-y">
          {suggestedUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucune suggestion
            </div>
          ) : (
            suggestedUsers.map((user) => {
              const isFollowing = followingUsers.has(user.id);
              const isLoading = loadingFollow.has(user.id);
              const userInitials = (user.username || user.id).substring(0, 2).toUpperCase();

              return (
                <div key={user.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {user.fullname || user.username || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username || user.id.substring(0, 8)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFollow(user.id)}
                      disabled={isLoading}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 shrink-0 ${
                        isFollowing
                          ? "bg-muted text-foreground hover:bg-muted/80"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {isFollowing ? "Abonné" : "Suivre"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground px-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <a href="#" className="hover:underline">Confidentialité</a>
          <span>·</span>
          <a href="#" className="hover:underline">Conditions d'utilisation</a>
          <span>·</span>
          <a href="#" className="hover:underline">Aide</a>
          <span>·</span>
          <a href="#" className="hover:underline">Publicité</a>
        </div>
        <p>MBolo © 2026</p>
      </div>
    </div>
  );
};

export default TrendingSidebar;
