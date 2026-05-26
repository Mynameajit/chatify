import prisma from '@/server/db';
import bcrypt from 'bcryptjs';
import { UpdateProfileInput } from './validation';

export class UserService {
  static async getProfile(userId: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let friendshipDate = null;
    let isBlocked = false;
    let hasBlockedMe = false;

    if (currentUserId && currentUserId !== userId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: userId },
            { user1Id: userId, user2Id: currentUserId },
          ]
        }
      });
      if (friendship) {
        friendshipDate = friendship.createdAt;
      }

      const blockedByMe = await prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: userId } }
      });
      isBlocked = !!blockedByMe;

      const blockedByThem = await prisma.blockedUser.findUnique({
        where: { blockerId_blockedId: { blockerId: userId, blockedId: currentUserId } }
      });
      hasBlockedMe = !!blockedByThem;
    }

    return { ...user, friendshipDate, isBlocked, hasBlockedMe };
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        bio: true,
      },
    });

    // Notify all friends about the update
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      const { getIO } = await import('@/server/socket/index');
      const io = getIO();
      if (io) {
        friendships.forEach(f => {
          const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
          io.to(`user:${friendId}`).emit('user:updated', {
            userId: user.id,
            name: user.name,
            avatar: user.profilePhoto,
            bio: user.bio
          });
        });
      }
    } catch (err) {
      console.error('Failed to emit user:updated:', err);
    }

    return user;
  }

  static async searchUsers(query: string, currentUserId: string) {
    const isSearching = query && query.trim() !== '';
    const users = await prisma.user.findMany({
      where: isSearching
        ? {
            AND: [
              { id: { not: currentUserId } },
              {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : {
            id: { not: currentUserId },
          },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        bio: true,
      },
      take: 20,
    });

    // Query friend requests and friendships for relationship computation
    const sentRequests = await prisma.friendRequest.findMany({
      where: { senderId: currentUserId },
      select: { receiverId: true, status: true, id: true },
    });
    const receivedRequests = await prisma.friendRequest.findMany({
      where: { receiverId: currentUserId },
      select: { senderId: true, status: true, id: true },
    });
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
    });

    const sentMap = new Map(sentRequests.map(r => [r.receiverId, r]));
    const receivedMap = new Map(receivedRequests.map(r => [r.senderId, r]));
    const friendSet = new Set(friendships.flatMap(f => [f.user1Id, f.user2Id]).filter(id => id !== currentUserId));

    return users.map(u => {
      let relationship = 'NONE';
      let requestId: string | undefined = undefined;

      if (friendSet.has(u.id)) {
        relationship = 'FRIENDS';
      } else if (sentMap.has(u.id)) {
        const req = sentMap.get(u.id)!;
        relationship = req.status === 'PENDING' ? 'SENT' : req.status === 'ACCEPTED' ? 'FRIENDS' : 'NONE';
        requestId = req.id;
      } else if (receivedMap.has(u.id)) {
        const req = receivedMap.get(u.id)!;
        relationship = req.status === 'PENDING' ? 'RECEIVED' : req.status === 'ACCEPTED' ? 'FRIENDS' : 'NONE';
        requestId = req.id;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.email.split('@')[0], // Fallback username
        avatar: u.profilePhoto || `https://i.pravatar.cc/150?u=${u.id}`,
        bio: u.bio || '',
        relationship,
        requestId,
      };
    });
  }

  static async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new Error("Cannot block yourself");
    }

    // Upsert block record
    const block = await prisma.blockedUser.upsert({
      where: {
        blockerId_blockedId: { blockerId, blockedId }
      },
      update: {},
      create: { blockerId, blockedId }
    });

    // Remove friendship if it exists
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { user1Id: blockerId, user2Id: blockedId },
          { user1Id: blockedId, user2Id: blockerId },
        ]
      }
    });

    // Cancel friend requests
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId },
          { senderId: blockedId, receiverId: blockerId },
        ]
      }
    });

    return { success: true };
  }

  static async unblockUser(blockerId: string, blockedId: string) {
    await prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId }
    });
    return { success: true };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Incorrect current password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { success: true };
  }
}
