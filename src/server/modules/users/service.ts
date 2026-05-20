import prisma from '@/server/db';
import { UpdateProfileInput } from './validation';

export class UserService {
  static async getProfile(userId: string) {
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

    return user;
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
}
