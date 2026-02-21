import { Play, Pause, Mic } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

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

  // Generate stable waveform bars
  const waveformBars = useMemo(() => 
    Array.from({ length: 28 }, () => Math.random() * 60 + 20),
    []
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => { setDuration(audio.duration); setError(false); };
    const handleTimeUpdate = () => { setCurrentTime(audio.currentTime); };
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const handleError = () => { setError(true); setIsPlaying(false); };

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
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { await audio.play(); setIsPlaying(true); }
    } catch { setError(true); setIsPlaying(false); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 min-w-[180px] opacity-50">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isMe ? 'bg-primary-foreground/20' : 'bg-primary/20'
        }`}>
          <Mic className="w-4 h-4" />
        </div>
        <span className={`text-xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          Audio indisponible
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isMe
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
            : 'bg-primary/15 hover:bg-primary/25 text-primary'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" fill="currentColor" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 space-y-0.5">
        <div 
          className="flex items-end gap-[2px] h-7 cursor-pointer relative"
          onClick={handleSeek}
        >
          {waveformBars.map((height, i) => {
            const barProgress = (i / waveformBars.length) * 100;
            const isPassed = barProgress < progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isPassed
                    ? isMe ? 'bg-primary-foreground' : 'bg-primary'
                    : isMe ? 'bg-primary-foreground/25' : 'bg-muted-foreground/25'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between">
          <span className={`text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
            {formatTime(isPlaying ? currentTime : duration)}
          </span>
        </div>
      </div>

      {/* Mic icon */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isMe ? 'bg-primary-foreground/10' : 'bg-primary/10'
      }`}>
        <Mic className={`w-3.5 h-3.5 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`} />
      </div>
    </div>
  );
};
