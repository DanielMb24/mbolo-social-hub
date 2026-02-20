// WebRTC Service pour les appels audio/vidéo
import { toast } from "sonner";

export type CallType = 'audio' | 'video';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

const defaultConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private callType: CallType = 'audio';

  constructor(config: WebRTCConfig = defaultConfig) {
    this.config = config;
  }

  async initializeCall(callType: CallType, localVideoElement?: HTMLVideoElement): Promise<MediaStream> {
    this.callType = callType;
    
    try {
      // Obtenir le flux local (audio + vidéo si appel vidéo)
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? { width: 1280, height: 720 } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Afficher le flux local dans l'élément vidéo si fourni
      if (localVideoElement && this.localStream) {
        localVideoElement.srcObject = this.localStream;
      }

      // Créer la connexion peer
      this.peerConnection = new RTCPeerConnection(this.config);

      // Ajouter les pistes locales à la connexion
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Gérer les pistes distantes
      this.peerConnection.ontrack = (event) => {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream?.addTrack(track);
        });
      };

      // Gérer les candidats ICE
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Envoyer le candidat ICE au pair distant via le serveur de signalisation
          console.log('ICE candidate:', event.candidate);
          // TODO: Implémenter l'envoi via WebSocket
        }
      };

      // Gérer les changements d'état de connexion
      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection?.connectionState);
        if (this.peerConnection?.connectionState === 'connected') {
          toast.success('Appel connecté');
        } else if (this.peerConnection?.connectionState === 'disconnected') {
          toast.info('Appel déconnecté');
        } else if (this.peerConnection?.connectionState === 'failed') {
          toast.error('Échec de la connexion');
        }
      };

      return this.localStream;
    } catch (error) {
      console.error('Erreur initialisation appel:', error);
      toast.error('Impossible d\'accéder au microphone/caméra');
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Erreur création offre:', error);
      throw error;
    }
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Erreur création réponse:', error);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Erreur traitement réponse:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection non initialisée');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Erreur ajout candidat ICE:', error);
      throw error;
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  endCall(): void {
    // Arrêter toutes les pistes locales
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Fermer la connexion peer
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected';
  }
}

// Instance singleton
let webrtcService: WebRTCService | null = null;

export const getWebRTCService = (): WebRTCService => {
  if (!webrtcService) {
    webrtcService = new WebRTCService();
  }
  return webrtcService;
};

export const resetWebRTCService = (): void => {
  if (webrtcService) {
    webrtcService.endCall();
    webrtcService = null;
  }
};
