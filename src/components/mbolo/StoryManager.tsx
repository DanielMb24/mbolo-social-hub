import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Clock, Image as ImageIcon, Type, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { storyApi } from "@/lib/api";
import type { Story } from "./StoriesBar";
import StoryCreator from "./StoryCreator";

interface StoryManagerProps {
  currentUserId: string;
  currentUsername: string;
  currentUserInitials: string;
  onStoryCreated?: (story: Story) => void;
  onStoryDeleted?: (storyId: string) => void;
}

const StoryManager = ({
  currentUserId,
  currentUsername,
  currentUserInitials,
  onStoryCreated,
  onStoryDeleted,
}: StoryManagerProps) => {
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Charger mes stories depuis l'API
  useEffect(() => {
    loadMyStories();
  }, [currentUserId]);

  const loadMyStories = async () => {
    setLoading(true);
    try {
      const stories = await storyApi.getMyStories();
      setMyStories(stories);
    } catch (error) {
      console.error("Erreur chargement stories:", error);
      setMyStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryCreated = (story: Story) => {
    setMyStories([story, ...myStories]);
    onStoryCreated?.(story);
    toast.success("✨ Story publiée avec succès !");
    loadMyStories(); // Recharger depuis l'API
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Supprimer cette story ?")) return;
    
      setDeletingId(storyId);
    try {
      await storyApi.deleteStory(storyId);
      const updatedStories = myStories.filter(s => s.id !== storyId);
      setMyStories(updatedStories);
      onStoryDeleted?.(storyId);
      toast.success("🗑️ Story supprimée");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expirée";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Header avec bouton de création */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground">Mes Stories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {myStories.length} {myStories.length > 1 ? 'stories actives' : 'story active'}
          </p>
        </div>
        <button
          onClick={() => setShowCreator(true)}
          className="btn-gradient-orange flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Créer une story</span>
        </button>
      </div>

      {/* Liste des stories */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : myStories.length === 0 ? (
        <div className="card-modern text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground mb-2">
            Aucune story active
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Partage un moment avec tes amis ! Les stories disparaissent après 24h.
          </p>
          <button
            onClick={() => setShowCreator(true)}
            className="btn-gradient-orange inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer ma première story
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {myStories.map((story) => (
            <div
              key={story.id}
              className="card-modern group relative overflow-hidden animate-fade-in"
            >
              {/* Preview */}
              <div
                className="relative h-48 rounded-xl overflow-hidden mb-3"
                style={
                  story.mediaType === "text"
                    ? { background: story.backgroundColor }
                    : { background: "#000" }
                }
              >
                {story.mediaType === "text" && (
                  <div className="flex items-center justify-center h-full p-4">
                    <p className="text-white text-lg font-bold text-center line-clamp-4">
                      {story.content}
                    </p>
                  </div>
                )}
                {story.mediaType === "image" && story.mediaUrl && (
                  <img
                    src={story.mediaUrl}
                    alt="story"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Type badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm flex items-center gap-1">
                  {story.mediaType === "text" ? (
                    <Type className="w-3 h-3 text-white" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-white" />
                  )}
                  <span className="text-xs text-white font-semibold">
                    {story.mediaType === "text" ? "Texte" : "Image"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expire dans {getTimeRemaining(story.expiresAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{story.views || 0} vues</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    disabled={deletingId === story.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 font-semibold text-sm"
                  >
                    {deletingId === story.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Story Creator Modal */}
      {showCreator && (
        <StoryCreator
          onClose={() => setShowCreator(false)}
          onStoryCreated={handleStoryCreated}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          currentUserInitials={currentUserInitials}
        />
      )}
    </div>
  );
};

export default StoryManager;
