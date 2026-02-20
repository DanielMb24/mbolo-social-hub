import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userApi } from "@/lib/api";
import { chatApi } from "@/lib/chat-api";
import { toast } from "sonner";
import { Loader2, Search, Users } from "lucide-react";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

interface User {
  id: string;
  username: string;
  fullname?: string;
  avatarUrl?: string;
}

export const NewConversationDialog = ({ open, onOpenChange, onConversationCreated }: NewConversationDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [following, setFollowing] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadFollowing();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = following.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullname?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(following);
    }
  }, [searchQuery, following]);

  const loadFollowing = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error("Vous devez être connecté");
        return;
      }

      // Récupérer la liste des personnes que vous suivez
      const followingList = await userApi.getFollowing(userId);
      setFollowing(followingList);
      setFilteredUsers(followingList);
    } catch (error: any) {
      console.error("Erreur chargement following:", error);
      toast.error("Erreur lors du chargement de vos abonnements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (otherUserId: string) => {
    setCreating(true);
    try {
      const conversation = await chatApi.getOrCreatePrivateConversation(otherUserId);
      toast.success("Conversation créée !");
      onConversationCreated(conversation.id);
      onOpenChange(false);
      setSearchQuery('');
    } catch (error: any) {
      console.error("Erreur création conversation:", error);
      toast.error("Erreur lors de la création de la conversation");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Sélectionnez une personne que vous suivez pour commencer une conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Liste des utilisateurs */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Aucun résultat" : "Vous ne suivez personne encore"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Allez dans "Personnes" pour suivre des utilisateurs
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateConversation(user.id)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{user.username}</p>
                    {user.fullname && (
                      <p className="text-sm text-muted-foreground">{user.fullname}</p>
                    )}
                  </div>
                  {creating && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
