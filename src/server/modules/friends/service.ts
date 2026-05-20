import prisma from '@/server/db';

export class FriendService {
  static async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    if (existingFriendship) {
      throw new Error('Already friends');
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'REJECTED') {
        // If request was rejected, delete the old entity to allow a fresh PENDING request
        await prisma.friendRequest.delete({
          where: { id: existingRequest.id },
        });
      } else {
        throw new Error('Friend request already exists');
      }
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
      },
      include: {
        sender: {
          select: { id: true, name: true, profilePhoto: true, email: true }
        }
      }
    });

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'FRIEND_REQUEST',
        content: `${request.sender.name} sent you a friend request.`,
        entityId: request.id,
      }
    });

    // Emit live over WebSocket
    try {
      const { getIO } = await import('@/server/socket/index');
      const io = getIO();
      if (io) {
        io.to(`user:${receiverId}`).emit('notification:new', {
          id: notification.id,
          type: 'FRIEND_REQUEST',
          content: notification.content,
          createdAt: notification.createdAt,
          sender: {
            id: senderId,
            name: request.sender.name,
            avatar: request.sender.profilePhoto || `https://i.pravatar.cc/150?u=${senderId}`,
            username: request.sender.email.split('@')[0],
          },
        });
      }
    } catch (err) {
      console.error('Failed to emit friend request notification:', err);
    }

    return request;
  }

  static async acceptRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: { id: true, name: true, email: true, profilePhoto: true } },
        receiver: { select: { id: true, name: true, email: true, profilePhoto: true } },
      }
    });

    if (!request) throw new Error('Request not found');
    if (request.receiverId !== userId) throw new Error('Unauthorized');
    if (request.status !== 'PENDING') throw new Error('Request is not pending');

    // Create friendship and update request status in a transaction
    const [friendship] = await prisma.$transaction([
      prisma.friendship.create({
        data: {
          user1Id: request.senderId,
          user2Id: request.receiverId,
        },
      }),
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    // Create direct Conversation if one doesn't exist
    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: request.senderId } } },
          { members: { some: { userId: request.receiverId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: request.senderId, role: 'ADMIN' },
              { userId: request.receiverId, role: 'MEMBER' },
            ],
          },
        },
      });
    }

    // Mark previous notifications for this request as read
    await prisma.notification.updateMany({
      where: {
        entityId: requestId,
        userId,
      },
      data: { isRead: true },
    });

    // Create accept notification for the sender
    const acceptNotif = await prisma.notification.create({
      data: {
        userId: request.senderId,
        type: 'SYSTEM',
        content: `${request.receiver.name} accepted your friend request! You can now chat.`,
      }
    });

    // Notify both sides via socket in real-time
    try {
      const { getIO } = await import('@/server/socket/index');
      const io = getIO();
      if (io) {
        // Emit acceptance events
        io.to(`user:${request.senderId}`).emit('friend:accepted', {
          friendId: request.receiverId,
          notification: acceptNotif,
        });
        io.to(`user:${request.receiverId}`).emit('friend:accepted', {
          friendId: request.senderId,
        });
      }
    } catch (err) {
      console.error('Failed to emit friend acceptance events:', err);
    }

    return friendship;
  }

  static async rejectRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Request not found');
    if (request.receiverId !== userId) throw new Error('Unauthorized');

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    // Mark previous notifications as read/deleted
    await prisma.notification.updateMany({
      where: {
        entityId: requestId,
        userId,
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  static async cancelRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Request not found');
    if (request.senderId !== userId) throw new Error('Unauthorized');

    await prisma.friendRequest.delete({
      where: { id: requestId },
    });

    // Delete associated notifications for the receiver
    await prisma.notification.deleteMany({
      where: {
        entityId: requestId,
        userId: request.receiverId,
      },
    });

    return { success: true };
  }

  static async removeFriend(userId: string, friendId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    if (!friendship) throw new Error('Friendship not found');

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    // Also delete any previous accepted friend requests to keep it clean
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      }
    });

    return { success: true };
  }

  static async getFriendList(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, name: true, profilePhoto: true, isOnline: true },
        },
        user2: {
          select: { id: true, name: true, profilePhoto: true, isOnline: true },
        },
      },
    });

    return friendships.map((f: any) => (f.user1Id === userId ? f.user2 : f.user1));
  }

  static async getNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return Promise.all(
      notifications.map(async (n) => {
        if (n.type === 'FRIEND_REQUEST' && n.entityId) {
          const req = await prisma.friendRequest.findUnique({
            where: { id: n.entityId },
            include: {
              sender: { select: { id: true, name: true, email: true, profilePhoto: true } }
            }
          });
          if (req) {
            return {
              id: n.id,
              userId: n.userId,
              type: 'friend_request' as const,
              content: n.content,
              isRead: n.isRead,
              entityId: n.entityId,
              createdAt: n.createdAt,
              status: req.status,
              sender: {
                id: req.sender.id,
                name: req.sender.name,
                avatar: req.sender.profilePhoto || `https://i.pravatar.cc/150?u=${req.sender.id}`,
                username: req.sender.email.split('@')[0],
              }
            };
          }
        }
        return {
          id: n.id,
          userId: n.userId,
          type: 'system' as const,
          content: n.content,
          isRead: n.isRead,
          entityId: n.entityId,
          createdAt: n.createdAt,
        };
      })
    );
  }

  static async markNotificationsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
