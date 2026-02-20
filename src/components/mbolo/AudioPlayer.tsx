import { Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  isMe: boolean;
}

export const AudioPlayer = ({ audioUrl, isMe }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('Erreur chargement audio:', audioUrl, e);
      setError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Erreur lecture audio:', err);
      setError(true);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Si erreur, afficher un message
  if (error) {
    return (
      <div className="flex items-center gap-2 min-w-[200px] opacity-50">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20 text-primary'
        }`}>
          <Play className="w-4 h-4 ml-0.5" />
        </div>
        <span className={`text-xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          Audio indisponible
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isMe
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
            : 'bg-primary/20 hover:bg-primary/30 text-primary'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" fill="currentColor" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform / Progress */}
      <div className="flex-1 space-y-1">
        {/* Forme d'onde stylisée */}
        <div className="flex items-center gap-0.5 h-6">
          {[...Array(30)].map((_, i) => {
            const height = Math.random() * 60 + 40;
            const isPassed = (i / 30) * 100 < progress;
            return (
              <div
                key={i}
                className={`w-0.5 rounded-full transition-colors ${
                  isPassed
                    ? isMe
                      ? 'bg-primary-foreground'
                      : 'bg-primary'
                    : isMe
                    ? 'bg-primary-foreground/30'
                    : 'bg-muted-foreground/30'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        {/* Slider invisible pour contrôle */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 opacity-0 absolute cursor-pointer"
          style={{ marginTop: '-24px' }}
        />
      </div>

      {/* Duration */}
      <span className={`text-xs shrink-0 ${
        isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
      }`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
};
