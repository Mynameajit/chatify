import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware } from './middleware/auth';
import prisma from '@/server/db';

let globalIo: Server | null = null;

export const getIO = (): Server | null => {
  return globalIo || (global as any).io || null;
};

export const initializeSocket = (io: Server) => {
  globalIo = io;
  (global as any).io = io;
  // Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Join conversation rooms
    const conversations = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    conversations.forEach((c: { conversationId: string }) => {
      socket.join(`conversation:${c.conversationId}`);
    });

    // Broadcast online status to friends (could be optimized)
    socket.broadcast.emit(`user:online`, { userId });

    // Handle Typing
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId,
        conversationId: data.conversationId,
      });
    });

    // Handle Seen
    socket.on('message:seen', async (data: { conversationId: string; messageIds: string[] }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:seen', {
        userId,
        conversationId: data.conversationId,
        messageIds: data.messageIds,
      });
    });

    // WebRTC Signaling
    socket.on('call:offer', (data: { offer: any; receiverId: string; callId: string; isVideo: boolean }) => {
      socket.to(`user:${data.receiverId}`).emit('call:incoming', {
        offer: data.offer,
        callerId: userId,
        callId: data.callId,
        isVideo: data.isVideo,
      });
    });

    socket.on('call:answer', (data: { answer: any; callerId: string; callId: string }) => {
      socket.to(`user:${data.callerId}`).emit('call:answered', {
        answer: data.answer,
        receiverId: userId,
        callId: data.callId,
      });
    });

    socket.on('call:ice-candidate', (data: { candidate: any; to: string }) => {
      socket.to(`user:${data.to}`).emit('call:ice-candidate', {
        candidate: data.candidate,
        from: userId,
      });
    });

    socket.on('call:reject', (data: { callerId: string; callId: string }) => {
      socket.to(`user:${data.callerId}`).emit('call:rejected', {
        receiverId: userId,
        callId: data.callId,
      });
    });

    socket.on('call:end', (data: { to: string; callId: string }) => {
      socket.to(`user:${data.to}`).emit('call:ended', {
        callId: data.callId,
      });
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      
      // We should potentially check if they have other active sockets before setting to offline
      // For simplicity, we just set to offline
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      socket.broadcast.emit(`user:offline`, { userId, lastSeen: new Date() });
    });
  });
};
