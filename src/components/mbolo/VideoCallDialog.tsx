import { Video, VideoOff, Phone, PhoneOff, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getWebRTCService, resetWebRTCService } from "@/lib/webrtc";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userAvatar: string;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export const VideoCallDialog = ({
  open,
  onOpenChange,
  userName,
  userAvatar,
  isIncoming = false,
  onAccept,
  onReject,
}: VideoCallDialogProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
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
      const localStream = await webrtcService.current.initializeCall('video', localVideoRef.current || undefined);
      
      // TODO: Envoyer l'offre via WebSocket au destinataire
      // const offer = await webrtcService.current.createOffer();
      // wsService.send({ type: 'CALL_OFFER', offer, to: userId });
      
      // Simuler la connexion après 2 secondes
      setTimeout(() => {
        setCallStatus('connected');
        // Simuler le flux distant
        if (remoteVideoRef.current && localStream) {
          remoteVideoRef.current.srcObject = localStream;
        }
      }, 2000);
    } catch (error) {
      console.error('Erreur initialisation appel vidéo:', error);
      handleEndCall();
    }
  };

  const cleanup = () => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
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
      const localStream = await webrtcService.current.initializeCall('video', localVideoRef.current || undefined);
      
      // TODO: Créer et envoyer la réponse
      // const answer = await webrtcService.current.createAnswer(offer);
      // wsService.send({ type: 'CALL_ANSWER', answer, to: userId });
      
      setCallStatus('connected');
      onAccept?.();
      toast.success("Appel vidéo connecté");
      
      // Simuler le flux distant
      if (remoteVideoRef.current && localStream) {
        remoteVideoRef.current.srcObject = localStream;
      }
    } catch (error) {
      console.error('Erreur acceptation appel vidéo:', error);
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
    toast.info("Appel vidéo terminé");
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webrtcService.current.toggleAudio(!newMutedState);
  };

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    webrtcService.current.toggleVideo(newVideoState);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isFullscreen ? 'max-w-full h-screen' : 'sm:max-w-3xl'} p-0`}>
        <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden">
          {/* Video principale (flux distant) */}
          {callStatus === 'connected' && isVideoOn ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-4xl mb-4">
                {userAvatar}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">{userName}</h3>
              <p className="text-sm text-white/70">
                {callStatus === 'ringing' && (isIncoming ? 'Appel vidéo entrant...' : 'Appel en cours...')}
                {callStatus === 'connected' && 'Caméra désactivée'}
              </p>
            </div>
          )}

          {/* Mini vidéo locale (en haut à droite) */}
          {callStatus === 'connected' && isVideoOn && (
            <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Durée de l'appel */}
          {callStatus === 'connected' && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <p className="text-white text-sm font-medium">{formatDuration(callDuration)}</p>
            </div>
          )}

          {/* Contrôles */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center justify-center gap-4">
              {callStatus === 'ringing' && isIncoming ? (
                <>
                  <button
                    onClick={handleAccept}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
                  >
                    <Video className="w-7 h-7" />
                  </button>
                  <button
                    onClick={handleReject}
                    className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center transition-colors"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleToggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                      isMuted ? 'bg-destructive text-destructive-foreground' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  <button
                    onClick={handleToggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                      !isVideoOn ? 'bg-destructive text-destructive-foreground' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center transition-colors"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>

                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="w-14 h-14 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
