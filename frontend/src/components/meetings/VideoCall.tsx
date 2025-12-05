import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VideoCallProps {
  meetingId: string;
  classId: string;
  onEndCall: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ meetingId, classId, onEndCall }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize media stream and WebRTC connection
  useEffect(() => {
    const initCall = async () => {
      try {
        // Get local media stream with audio and video
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: true 
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate connection (in a real app, you would connect to a signaling server)
        setTimeout(() => {
          setIsConnecting(false);
          toast({
            title: "Appel connecté",
            description: "Vous êtes maintenant connecté à l'appel",
          });
          // Simulate other participants joining (in a real app, this would come from the server)
          setParticipants(['Instructeur', 'Étudiant 1']);
        }, 2000);
        
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: "Erreur de connexion",
          description: "Impossible d'accéder à votre caméra ou microphone",
          variant: "destructive"
        });
      }
    };

    initCall();

    // Cleanup function
    return () => {
      // Stop all tracks in the local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peerConnections.current).forEach(connection => {
        connection.close();
      });
    };
  }, []);

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !isAudioEnabled;
        audioTracks[0].enabled = enabled;
        setIsAudioEnabled(enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !isVideoEnabled;
        videoTracks[0].enabled = enabled;
        setIsVideoEnabled(enabled);
      }
    }
  };

  // End call
  const endCall = () => {
    // Stop all tracks in the local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(connection => {
      connection.close();
    });
    
    onEndCall();
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="glass border-card-border mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Réunion en cours</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-foreground-muted" />
                <span className="text-sm text-foreground-muted">{participants.length + 1}</span>
              </div>
              {isConnecting && (
                <div className="text-sm text-warning animate-pulse">Connexion...</div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-4">
        {/* Local video */}
        <div className="relative bg-surface-elevated rounded-lg overflow-hidden aspect-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-elevated">
              <div className="p-4 rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            Vous {!isAudioEnabled && '(muet)'}
          </div>
        </div>

        {/* Remote video (placeholder) */}
        <div className="relative bg-surface-elevated rounded-lg overflow-hidden aspect-video">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {participants[0] || 'Participant'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 p-4 bg-surface-elevated rounded-lg">
        <Button
          onClick={toggleAudio}
          variant={isAudioEnabled ? "outline" : "destructive"}
          size="icon"
          className="rounded-full h-12 w-12"
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        
        <Button
          onClick={toggleVideo}
          variant={isVideoEnabled ? "outline" : "destructive"}
          size="icon"
          className="rounded-full h-12 w-12"
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        
        <Button
          onClick={endCall}
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;