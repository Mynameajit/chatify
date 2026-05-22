import prisma from '@/server/db';
import { z } from 'zod';
import { sendMessageSchema, editMessageSchema } from './validation';

export class MessageService {
  static async getMessages(conversationId: string, userId: string, cursor?: string) {
    const limit = 20;

    // Verify user is part of the conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });

    if (!isMember) {
      throw new Error('Not authorized to access this conversation');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        // If we want to hide deleted for me, we'd need a separate model or soft delete per user.
        // For simplicity, we just fetch all that aren't globally deleted, or we fetch them all and mask content on the client if isDeleted.
      },
      take: limit + 1, // Fetch 1 extra to check for next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' }, // Latest first
      include: {
        sender: {
          select: { id: true, name: true, profilePhoto: true },
        },
        attachments: true,
        replyTo: {
          select: { id: true, content: true, type: true, sender: { select: { name: true } } },
        },
        seenBy: {
          select: { userId: true, seenAt: true },
        },
        reactions: true,
      },
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    return {
      messages, // This will be sent as descending, frontend should likely reverse it
      nextCursor,
    };
  }

  static async sendMessage(userId: string, data: z.infer<typeof sendMessageSchema>) {
    const isMember = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId, conversationId: data.conversationId } },
    });

    if (!isMember) throw new Error('Not authorized');

    const members = await prisma.conversationMember.findMany({
      where: { conversationId: data.conversationId },
      select: { userId: true },
    });

    const otherMembers = members.filter(m => m.userId !== userId).map(m => m.userId);
    if (otherMembers.length > 0) {
      const blockExists = await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: { in: otherMembers } },
            { blockerId: { in: otherMembers }, blockedId: userId }
          ]
        }
      });
      if (blockExists) {
        throw new Error('Message blocked: You have blocked this user or they have blocked you');
      }
    }

    if (!data.content && (!data.attachments || data.attachments.length === 0)) {
      throw new Error('Message must have content or attachments');
    }

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        content: data.content,
        type: data.type,
        replyToId: data.replyToId,
        attachments: data.attachments ? {
          create: data.attachments.map(att => ({
            url: att.url,
            type: att.type,
            size: att.size,
            name: att.name,
          })),
        } : undefined,
      },
      include: {
        sender: { select: { id: true, name: true, profilePhoto: true } },
        attachments: true,
        replyTo: true,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast message over sockets in real-time
    try {

      const { getIO } = await import('@/server/socket/index');
      const io = getIO();
      if (io) {
        const formattedMsg = {
          id: message.id,
          chatId: message.conversationId,
          senderId: message.senderId,
          content: message.content || '',
          timestamp: message.createdAt.toISOString(),
          status: 'sent',
          attachments: message.attachments?.map((att: any) => ({
            id: att.id,
            type: att.type.toLowerCase(),
            url: att.url,
            name: att.name || 'attachment',
            size: att.size,
          })),
          sender: {
            id: message.sender.id,
            name: message.sender.name,
            avatar: message.sender.profilePhoto || `https://i.pravatar.cc/150?u=${message.sender.id}`,
          }
        };

        // Broadcast to the whole conversation room
        io.to(`conversation:${message.conversationId}`).emit('message:new', formattedMsg);

        // Also broadcast to each individual user room (for users who haven't explicitly subscribed to the room yet)
        members.forEach((member) => {
          io.to(`user:${member.userId}`).emit('message:new', formattedMsg);
        });
      }
    } catch (err) {
      console.error('Failed to broadcast message:', err);
    }

    return message;
  }

  static async editMessage(userId: string, messageId: string, data: z.infer<typeof editMessageSchema>) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId) throw new Error('Cannot edit others messages');
    if (message.isDeleted) throw new Error('Cannot edit deleted message');

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content: data.content },
      include: { attachments: true },
    });

    return updated;
  }

  static async deleteMessage(userId: string, messageId: string, forEveryone: boolean) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new Error('Message not found');

    if (forEveryone) {
      if (message.senderId !== userId) throw new Error('Cannot delete others message for everyone');
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, content: null },
      });
      return { success: true, forEveryone: true };
    } else {
      // In a real app we'd track "deleted for me" in a join table.
      // For now we'll just return success.
      return { success: true, forEveryone: false };
    }
  }

  static async markSeen(userId: string, conversationId: string) {
    // Find messages in convo not sent by me and not seen by me
    const unseen = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        seenBy: {
          none: { userId },
        },
      },
      select: { id: true },
    });

    if (unseen.length === 0) return { count: 0 };

    await prisma.messageSeen.createMany({
      data: unseen.map((msg: { id: string }) => ({
        messageId: msg.id,
        userId,
      })),
      skipDuplicates: true,
    });

    const messageIds = unseen.map((m: { id: string }) => m.id);

    // Broadcast message seen over sockets in real-time
    try {
      const members = await prisma.conversationMember.findMany({
        where: { conversationId },
        select: { userId: true },
      });

      const { getIO } = await import('@/server/socket/index');
      const io = getIO();
      if (io) {
        members.forEach((member) => {
          io.to(`user:${member.userId}`).emit('message:seen', {
            userId, // The user who read the messages
            conversationId,
            messageIds,
          });
        });
      }
    } catch (err) {
      console.error('Failed to emit message:seen socket events:', err);
    }

    return { count: unseen.length, messageIds };
  }
}
