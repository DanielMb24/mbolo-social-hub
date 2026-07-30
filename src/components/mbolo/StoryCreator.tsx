import { useState, useRef } from "react";
import { X, Image, Type, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Story } from "./StoriesBar";

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
];

interface StoryCreatorProps {
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
  currentUserId: string;
  currentUsername: string;
  currentUserInitials: string;
}

type CreatorMode = "text" | "image";

const StoryCreator = ({
  onClose,
  onStoryCreated,
  currentUserId,
  currentUsername,
  currentUserInitials,
}: StoryCreatorProps) => {
  const [mode, setMode] = useState<CreatorMode>("text");
  const [textContent, setTextContent] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gradientPage, setGradientPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PRESETS_PER_PAGE = 6;

  const visiblePresets = GRADIENT_PRESETS.slice(
    gradientPage * PRESETS_PER_PAGE,
    gradientPage * PRESETS_PER_PAGE + PRESETS_PER_PAGE
  );
  const totalPages = Math.ceil(GRADIENT_PRESETS.length / PRESETS_PER_PAGE);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = () => {
    if (mode === "text" && !textContent.trim()) {
      toast.error("Écris quelque chose pour ta story !");
      return;
    }
    if (mode === "image" && !imagePreview) {
      toast.error("Sélectionne une image pour ta story !");
      return;
    }

    const newStory: Story = {
      id: `story-${Date.now()}`,
      userId: currentUserId,
      username: currentUsername,
      avatarInitials: currentUserInitials,
      mediaType: mode,
      content: mode === "text" ? textContent.trim() : undefined,
      backgroundColor: mode === "text" ? selectedGradient : undefined,
      mediaUrl: mode === "image" ? imagePreview! : undefined,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      seen: false,
      duration: 5000,
    };

    onStoryCreated(newStory);
    toast.success("Story publiée !");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-bold text-foreground text-lg">Créer une story</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 p-4 border-b">
          <button
            onClick={() => setMode("text")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === "text"
                ? "bg-primary text-primary-foreground shadow"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Type className="w-4 h-4" />
            Texte
          </button>
          <button
            onClick={() => setMode("image")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === "image"
                ? "bg-primary text-primary-foreground shadow"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Image className="w-4 h-4" />
            Image
          </button>
        </div>

        {/* Preview */}
        <div className="px-4 pt-4">
          <div
            className="relative w-full h-52 rounded-xl overflow-hidden flex items-center justify-center select-none"
            style={
              mode === "text"
                ? { background: selectedGradient }
                : { background: "#111" }
            }
          >
            {/* User badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white font-bold text-xs">
                {currentUserInitials}
              </div>
              <span className="text-white text-xs font-semibold drop-shadow">{currentUsername}</span>
            </div>

            {mode === "text" && (
              <p className="text-white text-xl font-bold text-center px-6 leading-relaxed drop-shadow-lg break-words">
                {textContent || "Aperçu de ta story..."}
              </p>
            )}
            {mode === "image" && imagePreview && (
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
            )}
            {mode === "image" && !imagePreview && (
              <div className="flex flex-col items-center gap-2 text-white/60">
                <Image className="w-12 h-12" />
                <span className="text-sm">Aucune image sélectionnée</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {mode === "text" && (
            <>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Quoi de neuf ? 🎉"
                maxLength={150}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fond</p>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={gradientPage === 0}
                      onClick={() => setGradientPage(p => p - 1)}
                      className="p-1 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <span className="text-xs text-muted-foreground">{gradientPage + 1}/{totalPages}</span>
                    <button
                      disabled={gradientPage >= totalPages - 1}
                      onClick={() => setGradientPage(p => p + 1)}
                      className="p-1 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {visiblePresets.map((gradient, i) => (
                    <button
                      key={gradient}
                      onClick={() => setSelectedGradient(gradient)}
                      className="relative w-full aspect-square rounded-lg overflow-hidden transition-transform hover:scale-105"
                      style={{ background: gradient }}
                    >
                      {selectedGradient === gradient && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === "image" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Image className="w-5 h-5" />
                {imagePreview ? "Changer l'image" : "Sélectionner une image"}
              </button>
              {imagePreview && (
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="w-full py-2 rounded-xl text-destructive text-sm hover:bg-destructive/10 transition-colors"
                >
                  Supprimer l'image
                </button>
              )}
            </>
          )}
        </div>

        {/* Publish */}
        <div className="p-4 border-t">
          <button
            onClick={handlePublish}
            className="btn-gradient-orange w-full flex items-center justify-center gap-2"
          >
            <span className="text-lg">🔥</span>
            <span className="font-extrabold">Publier la story</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;
