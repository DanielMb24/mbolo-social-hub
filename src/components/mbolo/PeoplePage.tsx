import { Users, UserPlus, UserMinus, Search, TrendingUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { userApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  fullname?: string;
  bio?: string;
  avatarUrl?: string;
  followersCount: number;
  followingCount: number;
}

const PeoplePage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set());
  const currentUserId = localStorage.getItem('userId') || '';

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      // Pour l'instant, on charge tous les utilisateurs
      // TODO: Implémenter une vraie logique de suggestions 
      const allUsers = await userApi.searchUsers("");
      const filteredUsers = allUsers
        .filter(u => u.id !== currentUserId)
        .map(u => ({
          id: u.id,
          username: u.username,
          fullname: u.fullname,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          followersCount: u.followersCount || 0,
          followingCount: u.followingCount || 0
        }));
      setUsers(filteredUsers);

      // Charger les statuts de suivi
      const followingStatuses = await Promise.all(
        filteredUsers.map(async (user) => {
          try {
            const isFollowing = await userApi.isFollowing(user.id);
            return { userId: user.id, isFollowing };
          } catch {
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
      toast({ title: "Erreur", description: "Impossible de charger les suggestions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSuggestions();
      return;
    }

    try {
      setLoading(true);
      const results = await userApi.searchUsers(searchQuery);
      const filteredResults = results
        .filter(u => u.id !== currentUserId)
        .map(u => ({
          id: u.id,
          username: u.username,
          fullname: u.fullname,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          followersCount: u.followersCount || 0,
          followingCount: u.followingCount || 0
        }));
      setUsers(filteredResults);
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de recherche", variant: "destructive" });
    } finally {
      setLoading(false);
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
        toast({ title: "✅ Désabonné", description: "Vous ne suivez plus cet utilisateur" });
      } else {
        await userApi.followUser(userId);
        setFollowingUsers(prev => new Set(prev).add(userId));
        toast({ title: "✅ Abonné", description: "Vous suivez maintenant cet utilisateur" });
      }

      // Mettre à jour le compteur
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? {
                ...user,
                followersCount: isCurrentlyFollowing
                  ? user.followersCount - 1
                  : user.followersCount + 1
              }
            : user
        )
      );
    } catch (error: any) {
      // Si erreur 404, c'est que le backend n'est pas encore rebuild
      if (error?.response?.status === 404) {
        toast({ 
          title: "⚠️ Fonctionnalité en cours de déploiement", 
          description: "Le backend doit être rebuild. Voir DEPLOIEMENT_RAPIDE.md",
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
    <div className="flex justify-center">
      <div className="w-full max-w-2xl pb-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b mb-3">
          <div className="p-3">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Découvrir des personnes
            </h2>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Rechercher des personnes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        )}

        {/* Users List */}
        {!loading && users.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="space-y-2 px-3">
            {users.map((user) => {
              const isFollowing = followingUsers.has(user.id);
              const isLoading = loadingFollow.has(user.id);
              const userInitials = (user.username || user.id).substring(0, 2).toUpperCase();

              return (
                <div
                  key={user.id}
                  className="bg-card rounded-xl shadow-sm border p-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-md">
                      {userInitials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {user.fullname || user.username || 'Utilisateur'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username || user.id.substring(0, 8)}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          <strong className="text-foreground">{user.followersCount || 0}</strong> abonnés
                        </span>
                        <span>
                          <strong className="text-foreground">{user.followingCount || 0}</strong> abonnements
                        </span>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={() => toggleFollow(user.id)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 ${
                        isFollowing
                          ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          <span className="hidden sm:inline">Abonné</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Suivre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeoplePage;
