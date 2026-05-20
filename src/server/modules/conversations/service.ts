import prisma from '@/server/db';
import { z } from 'zod';
import { createConversationSchema } from './validation';

export class ConversationService {
  static async getConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, profilePhoto: true, isOnline: true, createdAt: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            seenBy: {
              none: { userId },
            },
          },
        });
        return {
          ...c,
          unreadCount,
        };
      })
    );

    return conversationsWithUnread;
  }

  static async createConversation(userId: string, data: z.infer<typeof createConversationSchema>) {
    // For 1-on-1 chat, check if it already exists
    if (!data.isGroup && data.participantIds.length === 1) {
      const otherUserId = data.participantIds[0];
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: otherUserId } } },
          ],
        },
      });

      if (existing) {
        return existing;
      }
    }

    // Create new conversation
    const membersData = [
      { userId, role: 'ADMIN' as const },
      ...data.participantIds.map(id => ({ userId: id, role: 'MEMBER' as const }))
    ];

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: data.isGroup,
        name: data.isGroup ? data.name : null,
        avatar: data.isGroup ? data.avatar : null,
        members: {
          create: membersData,
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, profilePhoto: true, isOnline: true, createdAt: true },
            },
          },
        },
      },
    });

    return conversation;
  }
}
