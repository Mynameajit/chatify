"use client";

if (typeof window !== "undefined" && !window.global) {
  (window as any).global = window;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = useAuthStore.getState().token;
    const socketUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      auth: {
        token: token,
      },
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Real-Time Global Listeners
    socketInstance.on('message:new', (message: any) => {
      console.log('Received new message over WebSocket:', message);
      const currentUserId = useAuthStore.getState().user?.id;
      const isActive = useChatStore.getState().activeChatId === message.chatId;

      // Append the message to our zustand store
      useChatStore.getState().addMessage(message.chatId, {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        timestamp: new Date(message.timestamp),
        status: (isActive && message.senderId !== currentUserId) ? 'seen' : 'sent',
        attachments: message.attachments,
      });

      // Play tone if the user did not send it AND is not currently looking at this chat
      const isMe = message.senderId === currentUserId;
      if (!isMe && !isActive) {
        const { playNotificationSound } = require('@/lib/sounds');
        playNotificationSound('message');
      }

      // If we are in this active chat and message is from others, mark as seen
      if (isActive && message.senderId !== currentUserId) {
        useChatStore.getState().markMessagesAsSeen(message.chatId);
      }

      // Also fetch chats again to ensure the order is correct and the lastMessage preview matches
      useChatStore.getState().fetchChats();
    });

    socketInstance.on('message:seen', (data: any) => {
      console.log('Received message:seen over WebSocket:', data);
      useChatStore.getState().updateMessagesStatus(data.conversationId, data.messageIds, 'seen');
    });

    socketInstance.on('notification:new', (notif: any) => {
      console.log('Received new notification over WebSocket:', notif);
      const { playNotificationSound } = require('@/lib/sounds');
      playNotificationSound('notification');
      toast(notif.content, {
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/notifications';
          }
        }
      });
    });

    socketInstance.on('friend:accepted', (data: any) => {
      console.log('Friend request accepted:', data);
      if (data.notification) {
        toast(data.notification.content);
      } else {
        toast('Your friend request was accepted! You can now chat.');
      }
      // Re-fetch conversations so the new friend's direct chat becomes active
      useChatStore.getState().fetchChats();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
