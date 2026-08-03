import { Users, UserPlus, UserMinus, Search, TrendingUp, Loader2, Sparkles, BadgeCheck, Star, Crown } from "lucide-react";
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
  verified?: boolean;
  category?: string;
  badge?: 'star' | 'crown' | 'verified';
}

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: Users },
  { id: 'verified', label: 'Vérifiés', icon: BadgeCheck },
  { id: 'popular', label: 'Populaires', icon: TrendingUp },
  { id: 'creators', label: 'Créateurs', icon: Sparkles },
];
const MAX_INITIAL_FOLLOW_CHECKS = 20;

const PeoplePage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('all');
  const currentUserId = localStorage.getItem('userId') || '';

  const loadSuggestions = async () => {
    try {
      setLoading(true);
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
          followingCount: u.followingCount || 0,
          verified: (u.followersCount || 0) > 1000,
          category: (u.followersCount || 0) > 2000 ? 'popular' : 'creators',
          badge: (u.followersCount || 0) > 3000 ? 'crown' as const : (u.followersCount || 0) > 2000 ? 'star' as const : (u.followersCount || 0) > 1000 ? 'verified' as const : undefined
        }));
      
      setUsers(filteredUsers);

      if (filteredUsers.length > 0) {
        const followingStatuses = await Promise.all(
          filteredUsers.slice(0, MAX_INITIAL_FOLLOW_CHECKS).map(async (user) => {
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
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          followingCount: u.followingCount || 0,
          verified: (u.followersCount || 0) > 1000,
          category: (u.followersCount || 0) > 2000 ? 'popular' : 'creators',
          badge: (u.followersCount || 0) > 3000 ? 'crown' as const : (u.followersCount || 0) > 2000 ? 'star' as const : (u.followersCount || 0) > 1000 ? 'verified' as const : undefined
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
    let shouldChangeFollowerCount = false;

    try {
      if (isCurrentlyFollowing) {
        await userApi.unfollowUser(userId);
        shouldChangeFollowerCount = true;
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast({ title: "✅ Désabonné", description: "Vous ne suivez plus cet utilisateur" });
      } else {
        const result = await userApi.followUser(userId);
        if (result.status === "PENDING") {
          toast({ title: "Demande envoyée", description: "Ce profil privé doit accepter votre demande" });
        } else {
          shouldChangeFollowerCount = true;
          setFollowingUsers(prev => new Set(prev).add(userId));
          toast({ title: "✅ Abonné", description: "Vous suivez maintenant cet utilisateur" });
        }
      }

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? {
                ...user,
                followersCount: isCurrentlyFollowing
                  ? Math.max(0, user.followersCount - 1)
                  : shouldChangeFollowerCount ? user.followersCount + 1 : user.followersCount
              }
            : user
        )
      );
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 404) {
        toast({ 
          title: "⚠️ Fonctionnalité en cours de déploiement", 
          description: "Le backend doit être rebuild.",
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

  const filteredUsers = users.filter(user => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'verified') return user.verified;
    if (activeCategory === 'popular') return user.followersCount > 2000;
    if (activeCategory === 'creators') return user.category === 'creators';
    return true;
  });

  const topUsers = users
    .filter(u => u.verified && u.followersCount > 2000)
    .sort((a, b) => b.followersCount - a.followersCount)
    .slice(0, 3);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl pb-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b mb-3">
          <div className="p-3">
            <h2 className="text-2xl font-extrabold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Découvrir des personnes
            </h2>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Rechercher des personnes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Suggestions Banner */}
        {!loading && topUsers.length > 0 && activeCategory === 'all' && (
          <div className="mx-3 mb-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Suggestions populaires</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none">
              {topUsers.map(user => {
                const userInitials = (user.username || user.id).substring(0, 2).toUpperCase();
                return (
                  <div key={user.id} className="flex-shrink-0 w-24 text-center">
                    <div className="relative inline-block mb-2">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                        {userInitials}
                      </div>
                      {user.badge === 'crown' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-md">
                          <Crown className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      {user.badge === 'star' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
                          <Star className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                      )}
                      {user.badge === 'verified' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                          <BadgeCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate">{user.fullname || user.username}</p>
                    <p className="text-[10px] text-muted-foreground">{user.followersCount} abonnés</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-10 h-10 text-primary-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground mb-2">Aucun utilisateur trouvé</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Essayez une autre recherche ou explorez les suggestions
            </p>
          </div>
        )}

        {/* Users List */}
        {!loading && filteredUsers.length > 0 && (
          <div className="space-y-2 px-3">
            {filteredUsers.map((user) => {
              const isFollowing = followingUsers.has(user.id);
              const isLoading = loadingFollow.has(user.id);
              const userInitials = (user.username || user.id).substring(0, 2).toUpperCase();

              return (
                <div
                  key={user.id}
                  className="bg-card rounded-xl shadow-sm border p-3 hover:shadow-md transition-all hover:scale-[1.01] duration-200"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Badge */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                        {userInitials}
                      </div>
                      {user.badge === 'crown' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-md border-2 border-card">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {user.badge === 'star' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-md border-2 border-card">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                      {user.badge === 'verified' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-md border-2 border-card">
                          <BadgeCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-foreground truncate">
                          {user.fullname || user.username || 'Utilisateur'}
                        </h3>
                        {user.verified && !user.badge && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username || user.id.substring(0, 8)}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {user.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          <span className="font-bold text-foreground">{user.followersCount || 0}</span>
                          <span className="text-muted-foreground">abonnés</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                          <span className="font-bold text-foreground">{user.followingCount || 0}</span>
                          <span className="text-muted-foreground">abonnements</span>
                        </div>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={() => toggleFollow(user.id)}
                      disabled={isLoading}
                      className={`px-6 py-2.5 rounded-xl font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 shadow-md ${
                        isFollowing
                          ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "btn-gradient-orange"
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
