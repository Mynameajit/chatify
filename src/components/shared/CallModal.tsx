"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useAuthStore } from '@/store/useAuthStore';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Loader2, Maximize, Minimize } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export function CallModal() {
  const { socket } = useSocket();
  const { user } = useAuthStore();
  
  const [callState, setCallState] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [isVideo, setIsVideo] = useState(false);
  const [caller, setCaller] = useState<{ id: string; callId: string; offer?: any } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<SimplePeer.Instance | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideoLocal = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideo(videoTrack.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const startRinging = () => {
    stopRinging();
    const { playNotificationSound } = require('@/lib/sounds');
    playNotificationSound('call');
    ringIntervalRef.current = setInterval(() => {
      playNotificationSound('call');
    }, 2500);
  };

  const stopRinging = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('call:incoming', ({ offer, callerId, callId, isVideo }) => {
      setCallState('receiving');
      setCaller({ id: callerId, callId, offer });
      setIsVideo(isVideo);
      startRinging();
    });

    socket.on('call:answered', ({ answer, callId }) => {
      stopRinging();
      if (connectionRef.current) {
        connectionRef.current.signal(answer);
        setCallState('connected');
      }
    });

    socket.on('call:ice-candidate', ({ candidate }) => {
      if (connectionRef.current) {
        connectionRef.current.signal(candidate);
      }
    });

    socket.on('call:rejected', () => {
      stopRinging();
      setCallState('idle');
      toast.error('Call was rejected');
      endCallCleanup();
    });

    socket.on('call:ended', () => {
      stopRinging();
      toast.info('Call ended');
      endCallCleanup();
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:answered');
      socket.off('call:ice-candidate');
      socket.off('call:rejected');
      socket.off('call:ended');
    };
  }, [socket]);

  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
    }
  }, [stream, callState]);

  // Make this a global function or expose via context if needed to start calls from anywhere
  // For simplicity here, we assume it's triggered via a custom event or store
  useEffect(() => {
    const handleStartCall = async (e: CustomEvent) => {
      const { receiverId, video } = e.detail;
      setIsVideo(video);
      setCallState('calling');
      
      try {
        const res = await api.post('/calls/start', { receiverId, isVideo: video });
        const callId = res.data.data.id;
        
        const currentStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
        setStream(currentStream);

        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream: currentStream,
        });

        peer.on('signal', (data) => {
          if (data.type === 'offer') {
            socket?.emit('call:offer', { offer: data, receiverId, callId, isVideo: video });
          } else {
            socket?.emit('call:ice-candidate', { candidate: data, to: receiverId });
          }
        });

        peer.on('stream', (userStream) => {
          if (userVideo.current) {
            userVideo.current.srcObject = userStream;
          }
        });

        connectionRef.current = peer;
        setCaller({ id: receiverId, callId });
      } catch (error) {
        toast.error('Could not start call');
        setCallState('idle');
      }
    };

    window.addEventListener('start-call' as any, handleStartCall);
    return () => window.removeEventListener('start-call' as any, handleStartCall);
  }, [socket]);

  const answerCall = async () => {
    stopRinging();
    setCallState('connected');
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      setStream(currentStream);

      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: currentStream,
      });

      peer.on('signal', (data) => {
        if (data.type === 'answer') {
          socket?.emit('call:answer', { answer: data, callerId: caller?.id, callId: caller?.callId });
        } else {
          socket?.emit('call:ice-candidate', { candidate: data, to: caller?.id });
        }
      });

      peer.on('stream', (userStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = userStream;
        }
      });

      if (caller?.offer) {
        peer.signal(caller.offer);
      }
    } catch (error) {
      toast.error('Could not access media devices');
    }
  };

  const endCallCleanup = () => {
    stopRinging();
    setCallState('idle');
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCaller(null);
    setDuration(0);
    setIsMuted(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const leaveCall = async () => {
    const finalDuration = duration;
    if (caller) {
      socket?.emit('call:end', { to: caller.id, callId: caller.callId });
    }
    if (caller?.callId) {
      await api.post('/calls/end', { callId: caller.callId, status: 'ANSWERED', duration: finalDuration }).catch(() => {});
    }
    endCallCleanup();
  };

  const rejectCall = async () => {
    if (caller) {
      socket?.emit('call:reject', { callerId: caller.id, callId: caller.callId });
      socket?.emit('call:end', { to: caller.id, callId: caller.callId });
      await api.post('/calls/end', { callId: caller.callId, status: 'REJECTED', duration: 0 }).catch(() => {});
    }
    endCallCleanup();
  };

  if (callState === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 transition-all duration-300">
      <div 
        ref={modalRef} 
        className={`bg-zinc-900 md:rounded-3xl w-full flex flex-col relative overflow-hidden shadow-2xl border-zinc-800 ${
          isFullscreen || window.innerWidth < 768 ? 'h-full md:h-screen w-full rounded-none' : 'max-w-4xl max-h-[85vh] aspect-[4/3] rounded-3xl border'
        }`}
      >
        
        {/* Receiving Call View */}
        {callState === 'receiving' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-6">
            <div className="relative">
              <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mx-auto absolute inset-0 scale-150 opacity-50" />
              <div className="w-32 h-32 bg-primary/30 rounded-full flex items-center justify-center relative z-10 animate-bounce shadow-xl shadow-primary/20">
                <Phone className="w-14 h-14 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Incoming Call...</h2>
              <p className="text-zinc-400">{isVideo ? 'Video Call' : 'Audio Call'}</p>
            </div>
            <div className="flex gap-8 justify-center pt-8">
              <Button onClick={rejectCall} size="lg" variant="destructive" className="rounded-full w-20 h-20 p-0 shadow-lg shadow-red-500/20 hover:scale-105 transition-transform">
                <PhoneOff className="w-8 h-8" />
              </Button>
              <Button onClick={answerCall} size="lg" className="rounded-full w-20 h-20 p-0 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 hover:scale-105 transition-transform">
                <Phone className="w-8 h-8" />
              </Button>
            </div>
          </div>
        )}

        {/* Calling View */}
        {callState === 'calling' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-6">
             <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <Phone className="w-12 h-12 text-primary opacity-80" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Calling...</h2>
              <p className="text-zinc-400">Waiting for answer</p>
            </div>
            <Button onClick={leaveCall} size="lg" variant="destructive" className="rounded-full w-20 h-20 p-0 mt-8 shadow-lg shadow-red-500/20 hover:scale-105 transition-transform">
              <PhoneOff className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* Connected View */}
        {callState === 'connected' && (
          <div className="w-full h-full flex flex-col relative bg-black">
            
            {/* Header info */}
            <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
               <div className="flex flex-col gap-1 drop-shadow-md">
                 <span className="text-white/90 font-medium text-sm md:text-base flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   {isVideo ? 'Video Call' : 'Audio Call'}
                 </span>
                 <span className="text-white/70 font-mono text-xl tracking-wider">
                   {formatDuration(duration)}
                 </span>
               </div>
               <Button onClick={toggleFullscreen} size="icon" variant="ghost" className="text-white hover:bg-white/20 pointer-events-auto rounded-full w-10 h-10 backdrop-blur-md bg-black/20 hidden md:flex">
                 {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
               </Button>
            </div>

            {/* Main remote video stream */}
            <div className="flex-1 w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
               {isVideo ? (
                 <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-zinc-800 flex items-center justify-center shadow-2xl mb-8">
                      <Phone className="w-16 h-16 md:w-24 md:h-24 text-zinc-600" />
                    </div>
                 </div>
               )}
            </div>

            {/* Local video PIP */}
            <div className={`absolute transition-all duration-300 z-20 ${
              isVideo ? 'bottom-28 right-4 md:bottom-32 md:right-8 w-28 md:w-48 aspect-[3/4] md:aspect-video bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl' 
                      : 'hidden'
            }`}>
               <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
               <div className="absolute bottom-2 left-2 flex gap-1">
                 {isMuted && <div className="bg-red-500 p-1 rounded-md"><MicOff className="w-3 h-3 text-white" /></div>}
                 {!isVideo && <div className="bg-zinc-800/80 p-1 rounded-md"><VideoOff className="w-3 h-3 text-white" /></div>}
               </div>
            </div>

            {/* Controls bar */}
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 flex justify-center items-center z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
              <div className="flex items-center gap-4 md:gap-6 bg-zinc-900/60 backdrop-blur-xl p-3 md:p-4 rounded-full border border-white/10 shadow-2xl">
                <Button 
                  onClick={toggleMute}
                  size="icon" 
                  variant={isMuted ? "destructive" : "secondary"} 
                  className={`rounded-full w-12 h-12 md:w-14 md:h-14 transition-all ${!isMuted ? 'bg-zinc-700/80 hover:bg-zinc-600 text-white' : ''}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
                </Button>
                
                <Button 
                  onClick={toggleVideoLocal}
                  size="icon" 
                  variant={!isVideo ? "destructive" : "secondary"} 
                  className={`rounded-full w-12 h-12 md:w-14 md:h-14 transition-all ${isVideo ? 'bg-zinc-700/80 hover:bg-zinc-600 text-white' : ''}`}
                >
                  {!isVideo ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <Video className="w-5 h-5 md:w-6 md:h-6" />}
                </Button>
                
                <Button 
                  onClick={leaveCall} 
                  size="icon" 
                  variant="destructive" 
                  className="rounded-full w-14 h-14 md:w-16 md:h-16 ml-2 shadow-lg shadow-red-500/20 hover:scale-105 transition-transform"
                >
                  <PhoneOff className="w-6 h-6 md:w-7 md:h-7" />
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
