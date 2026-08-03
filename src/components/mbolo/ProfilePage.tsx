import { Settings, LogOut, Camera, MapPin, Calendar, Edit2, Grid3x3, Video, Bookmark, Heart, ShieldOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { userApi, postApi } from "@/lib/api";
import { toast } from "sonner";

interface ProfilePageProps {
  onLogout?: () => void;
}

type ProfileTab = "posts" | "videos" | "saved";

const ProfilePage = ({ onLogout }: ProfilePageProps) => {
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const currentUserId = localStorage.getItem('userId') || '';
  const userId = urlUserId || currentUserId;
  const isOwnProfile = userId === currentUserId;
  
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    fullname: '',
    bio: '',
    location: '',
    profileVisibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE'
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const requestState = { active: true };

    setLoading(true);
    Promise.all([
      loadProfile(requestState),
      loadUserPosts(requestState),
      isOwnProfile ? loadSavedPosts(requestState) : Promise.resolve(),
      isOwnProfile ? loadBlockedUsers(requestState) : Promise.resolve(),
    ]).finally(() => {
      if (requestState.active) setLoading(false);
    });

    return () => {
      requestState.active = false;
    };
  }, [userId]); // Recharger quand l'userId change

  const loadProfile = async (requestState = { active: true }) => {
    try {
      const data = await userApi.getProfile(userId);
      if (!requestState.active) return;
      setProfile(data);
      setEditForm({
        username: data.username || '',
        fullname: data.fullname || '',
        bio: data.bio || '',
        location: data.location || '',
        profileVisibility: data.profileVisibility || 'PUBLIC'
      });
    } catch (error) {
      if (!requestState.active) return;
      // Profil par défaut si n'existe pas
      setProfile({
        id: userId,
        username: userId.substring(0, 8),
        email: '',
        bio: '',
        createdAt: new Date().toISOString()
      });
    }
  };

  const loadUserPosts = async (requestState = { active: true }) => {
    try {
      const allPosts = await postApi.getFeed();
      if (!requestState.active) return;
      // Filtrer les posts de l'utilisateur
      const userPosts = allPosts.filter((p: any) => p.authorId === userId);
      setPosts(userPosts.map((post: any) => ({
        ...post,
        likes: Array.isArray(post.likes) ? post.likes : [],
        mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
      })));
    } catch (error) {
      console.error('Error loading posts:', error);
      if (requestState.active) setPosts([]);
    }
  };

  const loadSavedPosts = async (requestState = { active: true }) => {
    try {
      const saved = await postApi.getSavedPosts();
      if (requestState.active) {
        setSavedPosts(saved.map((post: any) => ({
          ...post,
          likes: Array.isArray(post.likes) ? post.likes : [],
          mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
        })));
      }
    } catch {
      if (requestState.active) setSavedPosts([]);
    }
  };

  const loadBlockedUsers = async (requestState = { active: true }) => {
    try {
      const rows = await userApi.getBlockedUsers();
      if (requestState.active) setBlockedUsers(rows);
    } catch {
      if (requestState.active) setBlockedUsers([]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await userApi.updateProfile(userId, {
        username: editForm.username,
        fullname: editForm.fullname,
        bio: editForm.bio,
        location: editForm.location,
        profileVisibility: editForm.profileVisibility,
      });
      setProfile({ ...profile, ...result });
      setEditing(false);
      toast.success("Profil mis à jour avec succès");
      await loadProfile();
    } catch (error: any) {
      toast.error("Impossible de mettre à jour le profil");
    }
  };

  const handleBlockUser = async () => {
    if (isOwnProfile) return;
    try {
      await userApi.blockUser(userId);
      toast.success("Utilisateur bloqué");
    } catch {
      toast.error("Blocage impossible");
    }
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    try {
      await userApi.unblockUser(blockedUserId);
      setBlockedUsers(prev => prev.filter(user => user.id !== blockedUserId));
      toast.success("Utilisateur débloqué");
    } catch {
      toast.error("Déblocage impossible");
    }
  };

  const handlePhotoUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload vers le serveur
      let response;
      if (type === 'avatar') {
        response = await userApi.uploadAvatar(userId, file);
      } else {
        response = await userApi.uploadCover(userId, file);
      }
      
      // Recharger le profil pour obtenir la nouvelle URL
      await loadProfile();
      toast.success(`Photo de ${type === 'avatar' ? 'profil' : 'couverture'} mise à jour`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const tabs: { id: ProfileTab; icon: React.ElementType; label: string }[] = [
    { id: "posts", icon: Grid3x3, label: "Publications" },
    { id: "videos", icon: Video, label: "Vidéos" },
    { id: "saved", icon: Bookmark, label: "Enregistrés" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  const username = profile?.username || userId.substring(0, 8);
  const userInitials = username.substring(0, 2).toUpperCase();
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : '';

  return (
    <div className="flex justify-center min-w-0">
      <div className="w-full max-w-2xl pb-8 min-w-0">
        {/* Cover */}
        <div className="h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-muted via-muted/80 to-secondary relative overflow-hidden">
          {profile?.coverUrl && (
            <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
          {isOwnProfile && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'cover')}
              />
              <button 
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors disabled:opacity-50 shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Profile info */}
        <div className="px-3 sm:px-4 lg:px-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10 sm:-mt-12 min-w-0">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-background bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl sm:text-3xl font-bold shadow-xl">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              {isOwnProfile && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'avatar')}
                  />
                  <button 
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex-1 pb-1 sm:pb-2">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{profile?.fullname || username}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">@{username}</p>
                </div>
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                  {isOwnProfile && (
                    <>
                      <button 
                        onClick={() => setEditing(!editing)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
                      >
                        <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">{editing ? 'Annuler' : 'Modifier'}</span>
                      </button>
                      <button className="p-1.5 sm:p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </>
                  )}
                  {!isOwnProfile && (
                    <button
                      onClick={handleBlockUser}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-destructive text-destructive text-xs sm:text-sm font-semibold hover:bg-destructive/10 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <ShieldOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Bloquer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-3 sm:mt-4">
            {editing ? (
              <div className="space-y-2.5 sm:space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="input-modern mt-1"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nom complet</label>
                  <input
                    type="text"
                    value={editForm.fullname}
                    onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                    className="input-modern mt-1"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="input-modern mt-1 resize-none"
                    rows={3}
                    placeholder="Parlez-nous de vous..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Localisation</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="input-modern mt-1"
                    placeholder="Ville, Pays"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Visibilité du profil</label>
                  <select
                    value={editForm.profileVisibility}
                    onChange={(e) => setEditForm({ ...editForm, profileVisibility: e.target.value as 'PUBLIC' | 'PRIVATE' })}
                    className="input-modern mt-1"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Privé</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="btn-primary w-full"
                >
                  Enregistrer les modifications
                </button>
                <div className="rounded-lg border p-3">
                  <h3 className="text-sm font-bold text-foreground">Utilisateurs bloqués</h3>
                  <div className="mt-2 space-y-2">
                    {blockedUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucun utilisateur bloqué</p>
                    ) : blockedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{user.fullname || user.username || "Utilisateur"}</p>
                          <p className="truncate text-xs text-muted-foreground">@{user.username || user.id}</p>
                        </div>
                        <button onClick={() => handleUnblockUser(user.id)} className="rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold">
                          Débloquer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words">
                  {profile?.bio || `Membre de MBolo 🇬🇦`}
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                  {profile?.location && <span className="flex min-w-0 items-center gap-1"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">{profile.location}</span></span>}
                  {joinDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {joinDate}</span>}
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm">
            <span className="text-foreground"><strong className="font-bold">{posts.length}</strong> <span className="text-muted-foreground">posts</span></span>
            <span className="text-foreground">
              <strong className="font-bold">{profile?.followersCount || 0}</strong> <span className="text-muted-foreground">abonnés</span>
            </span>
            <span className="text-foreground">
              <strong className="font-bold">{profile?.followingCount || 0}</strong> <span className="text-muted-foreground">suivis</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b mt-4 sm:mt-6 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    isActive
                      ? "border-accent text-accent"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content grid */}
          <div className="mt-3 sm:mt-4">
            {activeTab === "posts" && (
              posts.length === 0 ? (
                <div className="py-8 sm:py-12 text-center">
                  <Grid3x3 className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                  <p className="text-muted-foreground text-xs sm:text-sm">Aucune publication</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="card-modern min-w-0">
                      <p className="text-xs sm:text-sm text-foreground break-words whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {post.likes?.length || 0}
                        </span>
                        <span>{new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            {activeTab === "videos" && (
              <div className="py-8 sm:py-12 text-center">
                <Video className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                <p className="text-muted-foreground text-xs sm:text-sm">Aucune vidéo</p>
              </div>
            )}
            {activeTab === "saved" && (
              !isOwnProfile ? (
                <div className="py-8 sm:py-12 text-center">
                  <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                  <p className="text-muted-foreground text-xs sm:text-sm">Contenus privés</p>
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="py-8 sm:py-12 text-center">
                  <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                  <p className="text-muted-foreground text-xs sm:text-sm">Aucun contenu enregistré</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {savedPosts.map((post) => (
                    <div key={post.id} className="card-modern min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs sm:text-sm text-foreground flex-1 min-w-0 break-words whitespace-pre-wrap">{post.content || "Publication"}</p>
                        <Bookmark className="w-4 h-4 text-primary shrink-0" />
                      </div>
                      {post.mediaUrls?.[0] && (
                        <img
                          src={post.mediaUrls[0]}
                          alt=""
                          className="mt-3 w-full max-h-72 rounded-lg object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {post.likes?.length || 0}
                        </span>
                        <span>{new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Logout */}
          {isOwnProfile && (
            <button
              onClick={onLogout}
              className="mt-6 sm:mt-8 w-full py-2.5 sm:py-3 rounded-lg border-2 border-destructive text-destructive font-semibold text-xs sm:text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Se déconnecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
