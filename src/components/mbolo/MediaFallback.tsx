import { FileQuestion, Music, Image as ImageIcon } from "lucide-react";

interface MediaFallbackProps {
  type: 'image' | 'audio' | 'file';
  fileName?: string;
  isMe?: boolean;
}

export const MediaFallback = ({ type, fileName, isMe = false }: MediaFallbackProps) => {
  const getIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-8 h-8" />;
      case 'audio':
        return <Music className="w-8 h-8" />;
      default:
        return <FileQuestion className="w-8 h-8" />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'image':
        return 'Image indisponible';
      case 'audio':
        return 'Audio indisponible';
      default:
        return 'Fichier indisponible';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed ${
      isMe 
        ? 'border-primary-foreground/30 text-primary-foreground/70' 
        : 'border-muted-foreground/30 text-muted-foreground'
    }`}>
      {getIcon()}
      <p className="text-xs mt-2">{getMessage()}</p>
      {fileName && (
        <p className="text-xs mt-1 opacity-60 truncate max-w-[200px]">{fileName}</p>
      )}
    </div>
  );
};
