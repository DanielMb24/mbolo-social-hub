import { Settings, LogOut, Camera, MapPin, Calendar, Edit2, Grid3x3, Video, Bookmark, Heart, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { userApi, postApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface ProfilePageProps {
  onLogout: () => void;
}

type ProfileTab = "posts" | "videos" | "saved";

const ProfilePage = ({ onLogout }: ProfilePageProps) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    fullname: '',
    bio: '',
    location: ''
  });
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    loadProfile();
    loadUserPosts();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userApi.getProfile(userId);
      setProfile(data);
      setEditForm({
        username: data.username || '',
        email: data.email || '',
        fullname: data.fullname || '',
        bio: data.bio || '',
        location: data.location || ''
      });
    } catch (error) {
      // Profil par défaut si n'existe pas
      setProfile({
        id: userId,
        username: userId.substring(0, 8),
        email: '',
        bio: '',
        createdAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      const allPosts = await postApi.getFeed();
      // Filtrer les posts de l'utilisateur
      const userPosts = allPosts.filter((p: any) => p.authorId === userId);
      setPosts(userPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile with data:', editForm);
      const result = await userApi.updateProfile(userId, editForm);
      console.log('Profile updated successfully:', result);
      setProfile({ ...profile, ...result });
      setEditing(false);
      toast({ title: "Profil mis à jour !", description: "Vos modifications ont été enregistrées" });
      // Recharger le profil pour être sûr
      await loadProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de mettre à jour le profil", 
        variant: "destructive" 
      });
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
    <div className="flex justify-center">
      <div className="w-full max-w-2xl pb-8">
        {/* Cover */}
        <div className="h-40 lg:h-56 bg-gradient-to-r from-primary via-primary/80 to-secondary relative">
          <button className="absolute top-3 right-3 p-2 rounded-full bg-foreground/20 text-primary-foreground hover:bg-foreground/30 transition-colors backdrop-blur-sm">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Profile info */}
        <div className="px-4 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-3xl sm:text-4xl font-bold shadow-lg">
                {userInitials}
              </div>
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-md hover:opacity-90 transition-opacity">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">{profile?.fullname || username}</h2>
                  <p className="text-sm text-muted-foreground">@{username}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditing(!editing)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {editing ? 'Annuler' : 'Modifier'}
                  </button>
                  <button className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nom complet</label>
                  <input
                    type="text"
                    value={editForm.fullname}
                    onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ville, Pays"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
                >
                  Enregistrer les modifications
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground leading-relaxed">
                  {profile?.bio || `Membre de MBolo 🇬🇦`}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {profile?.email && <span className="flex items-center gap-1">📧 {profile.email}</span>}
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile?.location || 'Gabon'}</span>
                  {joinDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Rejoint en {joinDate}</span>}
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <span className="text-foreground"><strong className="font-bold">{posts.length}</strong> <span className="text-muted-foreground">publications</span></span>
            <span className="text-foreground">
              <strong className="font-bold">{profile?.followersCount || 0}</strong> <span className="text-muted-foreground">abonnés</span>
            </span>
            <span className="text-foreground">
              <strong className="font-bold">{profile?.followingCount || 0}</strong> <span className="text-muted-foreground">abonnements</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content grid */}
          <div className="mt-4">
            {activeTab === "posts" && (
              posts.length === 0 ? (
                <div className="py-12 text-center">
                  <Grid3x3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Aucune publication pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg bg-card">
                      <p className="text-sm text-foreground">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
              <div className="py-12 text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune vidéo pour le moment</p>
              </div>
            )}
            {activeTab === "saved" && (
              <div className="py-12 text-center">
                <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Tes contenus enregistrés apparaîtront ici</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="mt-8 w-full py-3 rounded-xl border border-destructive text-destructive font-medium text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
