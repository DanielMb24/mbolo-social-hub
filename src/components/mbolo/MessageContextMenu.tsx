import { Reply, Forward, Copy, Trash2, Star } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ReactNode } from "react";

interface MessageContextMenuProps {
  children: ReactNode;
  messageId: string;
  messageContent: string;
  isMe: boolean;
  onReply: (messageId: string, content: string) => void;
  onForward: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onStar: (messageId: string) => void;
}

export const MessageContextMenu = ({
  children,
  messageId,
  messageContent,
  isMe,
  onReply,
  onForward,
  onDelete,
  onStar,
}: MessageContextMenuProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onReply(messageId, messageContent)}>
          <Reply className="w-4 h-4 mr-2" />
          Répondre
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onForward(messageId)}>
          <Forward className="w-4 h-4 mr-2" />
          Transférer
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onStar(messageId)}>
          <Star className="w-4 h-4 mr-2" />
          Marquer
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copier
        </ContextMenuItem>
        {isMe && (
          <ContextMenuItem onClick={() => onDelete(messageId)} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
