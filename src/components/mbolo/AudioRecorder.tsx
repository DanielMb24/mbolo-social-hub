import { Mic, X, Send, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export const AudioRecorder = ({ onSend, onCancel }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= 300) { // 5 minutes max
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Erreur accès micro:", error);
      toast.error("Impossible d'accéder au microphone");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      cleanup();
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {isRecording ? "Enregistrement..." : "Aperçu"}
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Visualisation */}
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {isRecording ? (
            <>
              {/* Animation d'enregistrement */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-destructive/40 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center">
                      <Mic className="w-6 h-6 text-destructive-foreground" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Forme d'onde animée */}
              <div className="flex items-center gap-1 h-12">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Lecteur audio */}
              {audioUrl && (
                <div className="w-full">
                  <audio
                    src={audioUrl}
                    controls
                    className="w-full"
                  />
                </div>
              )}
            </>
          )}

          {/* Timer */}
          <div className="text-2xl font-mono font-semibold text-foreground">
            {formatTime(duration)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          {isRecording ? (
            <>
              <button
                onClick={handleCancel}
                className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-6 h-6" />
              </button>
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity shadow-lg"
              >
                <div className="w-6 h-6 rounded bg-primary-foreground" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={handleSend}
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity shadow-lg"
              >
                <Send className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Aide */}
        <p className="text-xs text-center text-muted-foreground">
          {isRecording
            ? "Cliquez sur le carré pour arrêter l'enregistrement"
            : "Écoutez votre message et envoyez-le"}
        </p>
      </div>
    </div>
  );
};
