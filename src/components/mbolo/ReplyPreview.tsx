import { X } from "lucide-react";

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  onCancel: () => void;
}

export const ReplyPreview = ({ replyTo, onCancel }: ReplyPreviewProps) => {
  if (!replyTo) return null;

  return (
    <div className="px-4 py-2 border-t bg-muted/30">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-10 bg-primary rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary">
                Répondre à {replyTo.senderName}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {replyTo.content}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
