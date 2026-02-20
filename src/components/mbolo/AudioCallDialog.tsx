import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getWebRTCService, resetWebRTCService } from "@/lib/webrtc";

interface AudioCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userAvatar: string;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export const AudioCallDialog = ({
  open,
  onOpenChange,
  userName,
  userAvatar,
  isIncoming = false,
  onAccept,
  onReject,
}: AudioCallDialogProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const webrtcService = useRef(getWebRTCService());

  useEffect(() => {
    if (open && !isIncoming) {
      // Initialiser l'appel sortant
      initializeOutgoingCall();
    }

    return () => {
      if (!open) {
        cleanup();
      }
    };
  }, [open]);

  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStatus]);

  const initializeOutgoingCall = async () => {
    try {
      await webrtcService.current.initializeCall('audio');
      // TODO: Envoyer l'offre via WebSocket au destinataire
      // const offer = await webrtcService.current.createOffer();
      // wsService.send({ type: 'CALL_OFFER', offer, to: userId });
      
      // Simuler la connexion après 2 secondes
      setTimeout(() => {
        setCallStatus('connected');
      }, 2000);
    } catch (error) {
      console.error('Erreur initialisation appel:', error);
      handleEndCall();
    }
  };

  const cleanup = () => {
    webrtcService.current.endCall();
    resetWebRTCService();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    try {
      await webrtcService.current.initializeCall('audio');
      // TODO: Créer et envoyer la réponse
      // const answer = await webrtcService.current.createAnswer(offer);
      // wsService.send({ type: 'CALL_ANSWER', answer, to: userId });
      
      setCallStatus('connected');
      onAccept?.();
      toast.success("Appel connecté");
    } catch (error) {
      console.error('Erreur acceptation appel:', error);
      handleEndCall();
    }
  };

  const handleReject = () => {
    cleanup();
    setCallStatus('ended');
    onReject?.();
    onOpenChange(false);
    toast.info("Appel refusé");
  };

  const handleEndCall = () => {
    cleanup();
    setCallStatus('ended');
    onOpenChange(false);
    toast.info("Appel terminé");
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webrtcService.current.toggleAudio(!newMutedState);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center py-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-2xl mb-4">
            {userAvatar}
          </div>

          {/* User Name */}
          <h3 className="text-xl font-semibold text-foreground mb-2">{userName}</h3>

          {/* Call Status */}
          <p className="text-sm text-muted-foreground mb-6">
            {callStatus === 'ringing' && (isIncoming ? 'Appel entrant...' : 'Appel en cours...')}
            {callStatus === 'connected' && formatDuration(callDuration)}
          </p>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            {callStatus === 'connected' && (
              <>
                <button
                  onClick={handleToggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isMuted ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    !isSpeakerOn ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>

          {/* Audio distant (caché) */}
          <audio ref={remoteAudioRef} autoPlay />

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {callStatus === 'ringing' && isIncoming ? (
              <>
                <button
                  onClick={handleAccept}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
                >
                  <Phone className="w-7 h-7" />
                </button>
                <button
                  onClick={handleReject}
                  className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center transition-colors"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </>
            ) : (
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center transition-colors"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
