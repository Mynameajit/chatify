"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useAuthStore } from '@/store/useAuthStore';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Loader2 } from 'lucide-react';
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

  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
  };

  const leaveCall = async () => {
    if (caller) {
      socket?.emit('call:end', { to: caller.id, callId: caller.callId });
    }
    if (caller?.callId) {
      await api.post('/calls/end', { callId: caller.callId, status: 'ANSWERED' }).catch(() => {});
    }
    endCallCleanup();
  };

  const rejectCall = async () => {
    if (caller) {
      socket?.emit('call:reject', { callerId: caller.id, callId: caller.callId });
      socket?.emit('call:end', { to: caller.id, callId: caller.callId });
      await api.post('/calls/end', { callId: caller.callId, status: 'REJECTED' }).catch(() => {});
    }
    endCallCleanup();
  };

  if (callState === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-2xl flex flex-col items-center">
        
        {callState === 'receiving' && (
          <div className="text-center space-y-6 py-12">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mx-auto">
              <Phone className="w-12 h-12 text-primary animate-bounce" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Incoming Call...</h2>
            <div className="flex gap-4 justify-center">
              <Button onClick={rejectCall} size="lg" variant="destructive" className="rounded-full w-14 h-14 p-0">
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button onClick={answerCall} size="lg" className="rounded-full w-14 h-14 p-0 bg-green-500 hover:bg-green-600 text-white">
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        {callState === 'calling' && (
          <div className="text-center space-y-6 py-12">
             <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Calling...</h2>
            <Button onClick={leaveCall} size="lg" variant="destructive" className="rounded-full w-14 h-14 p-0 mt-4">
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        )}

        {callState === 'connected' && (
          <div className="w-full relative">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-zinc-800">
               {isVideo ? (
                 <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Phone className="w-16 h-16 text-zinc-500" />
                 </div>
               )}
               <div className="absolute top-4 right-4 w-1/4 aspect-video bg-zinc-900 rounded-lg overflow-hidden border-2 border-primary/50 shadow-xl">
                 {isVideo ? (
                   <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Phone className="w-8 h-8 text-zinc-600" />
                    </div>
                 )}
               </div>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button size="icon" variant="secondary" className="rounded-full w-12 h-12">
                <Mic className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full w-12 h-12">
                <Video className="w-5 h-5" />
              </Button>
              <Button onClick={leaveCall} size="icon" variant="destructive" className="rounded-full w-12 h-12">
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
