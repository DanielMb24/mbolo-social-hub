import { Smile } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageReactionsProps {
  messageId: string;
  reactions: { emoji: string; count: number; users: string[] }[];
  onReact: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageReactions = ({ 
  messageId, 
  reactions, 
  onReact,
  currentUserId 
}: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji: string) => {
    onReact(messageId, emoji);
    setShowPicker(false);
  };

  const hasReacted = (reaction: { users: string[] }) => {
    return reaction.users.includes(currentUserId);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {/* Afficher les réactions existantes */}
      {reactions.map((reaction, index) => (
        <button
          key={index}
          onClick={() => handleReact(reaction.emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
            hasReacted(reaction)
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Bouton pour ajouter une réaction */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <Smile className="w-4 h-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="w-10 h-10 rounded-lg hover:bg-muted transition-colors text-xl flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
