import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Send } from "lucide-react";
import { toast } from "sonner";
import type { Conversation } from "@/lib/chat-api";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  messageContent: string;
  conversations: Conversation[];
  onForward: (conversationIds: string[], messageContent: string) => void;
}

export const ForwardMessageDialog = ({
  open,
  onOpenChange,
  messageId,
  messageContent,
  conversations,
  onForward,
}: ForwardMessageDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  const filteredConversations = conversations.filter(conv => {
    const displayName = conv.groupName || conv.participants.join(', ');
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleConversation = (convId: string) => {
    setSelectedConversations(prev =>
      prev.includes(convId)
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    );
  };

  const handleForward = () => {
    if (selectedConversations.length === 0) {
      toast.error("Sélectionnez au moins une conversation");
      return;
    }

    onForward(selectedConversations, messageContent);
    setSelectedConversations([]);
    setSearchQuery("");
    onOpenChange(false);
    toast.success(`Message transféré à ${selectedConversations.length} conversation(s)`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transférer le message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Aperçu du message */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {messageContent}
            </p>
          </div>

          {/* Liste des conversations */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredConversations.map((conv) => {
              const displayName = conv.groupName || conv.participants.join(', ');
              const avatar = displayName.substring(0, 2).toUpperCase();
              const isSelected = selectedConversations.includes(conv.id);

              return (
                <button
                  key={conv.id}
                  onClick={() => toggleConversation(conv.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isSelected ? 'bg-primary/10 border-2 border-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm shrink-0">
                    {avatar}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.type === 'GROUP' ? `${conv.participants.length} membres` : 'Conversation privée'}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bouton envoyer */}
          <button
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Transférer à {selectedConversations.length} conversation(s)</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
